// renderer for the OLED, returns a function that takes input data and returns a buffer, 128x32 in size, four rows of 128x8, in reverese order
// arbitrary number of items, position and size stored in the item, item is just buffer of data, text is rendered into bitmap buffer and stored in item, images are stored in ite


// class for items to render
class Item {
    constructor(pos_x, pos_y, size_x, size_y, buffer) {
        this.pos_x = pos_x;
        this.pos_y = pos_y;
        this.size_x = size_x;
        this.size_y = size_y;
        this.buffer = buffer;
    }

    getBit(pos_x, pos_y) {
        // get bit from buffer
        // pos_x is the x position of the bit in the buffer in bits
        // pos_y is the y position of the bit in the buffer in lines
        // get byte
        let offset = pos_y * this.size_x + pos_x;
        let byte = this.buffer[Math.floor(offset / 8)];
        // get bit, assume offset is 0-7 because fuck figuring out anything else
        let bit = (byte & (1 << offset % 8)) && 1;
        return bit
    }    
}

class Renderer {
    constructor() {
        this.items = [];
        this.buffer = new Buffer.alloc(512);
        this.buffer.fill(0);
    }

    #getBit(byte, bit) {
        return (byte & (1 << bit)) && 1;
    }
    
    #setBit(byte, bit) {
        return byte | 1<<bit;
    }

    // coalesce items into buffer, allowing for overlap and transparency
    #renderIntermediary() {
        // clear buffer
        this.buffer.fill(0);
        // render items into buffer
        // go to next line after reaching end of line in item buffer, determined by size_x
        this.items.forEach((item) => {
            // turn bit pos x into byte pos x with remainding bits
            let start_byte_pos_x = Math.floor(item.pos_x / 8);
            let start_bit_pos_x = item.pos_x % 8;
            // render item into buffer
            // iterate over item buffer, and copy into buffer
            for (let i = 0; i < item.size_y; i++) {
                for (let j = 0; j < item.size_x; j++) {
                    // find our bearings, what pixel are we on of the item?
                    // relative byte and bit pos is the position of the pixel in the line of the item buffer
                    let x_relative_byte = Math.floor(j / 8);
                    let x_relative_bit = j % 8;
                    // clamp to next byte if we go over
                    if (x_relative_bit + start_bit_pos_x > 7) {
                        x_relative_byte++;
                        x_relative_bit = start_bit_pos_x + x_relative_bit - 8;
                    }

                    // absolute byte and bit pos is the position of the pixel in the buffer
                    let x_absolute_byte = start_byte_pos_x + x_relative_byte;
                    let x_absolute_bit = start_bit_pos_x + x_relative_bit;

                    // grab byte from own buffer
                    let own_byte = this.buffer[(item.pos_y * 16) + (i * 16) + x_absolute_byte];
                    // grab bit from byte of own buffer
                    let own_bit = this.#getBit(own_byte, x_relative_bit);

                    let buffer_bit = item.getBit(j, i);

                    /*
                    THIS IS THE PART THAT CAN CHANGE TO ALLOW FOR TRANSPARENCY ETC
                    */
                    // if buffer bit is 1, then overwrite buffer bit
                    if (own_bit == 1) {
                        console.log('overwriting bit');
                    }
                    if (buffer_bit == 1) {
                        // overwrite own bit with buffer bit
                        this.buffer[(item.pos_y * 16) + (i * 16) + x_absolute_byte] = this.#setBit(own_byte, x_relative_bit);
                    }
                }
            }
        });
    }

    #buildByte(bit_array) {
        // confirmed working
        let byte = Buffer.alloc(1);
        byte.fill(0);
        for (let i = 0; i < 8; i++) {
            byte[0] |= (bit_array[i] << i);
        }
        return byte;
    }
    
    render() {
        this.#renderIntermediary();
        // if settings are set to horizontal then return this.buffer, else:
        // generate rows
        // 4 rows, 128x8 each, bit per pixel
        // input buffer is 512 bytes, 128x32
        let rows = [];
        for (let i = 0; i < 4; i++) {
            let start = i * 128;
            let buffer = Buffer.alloc(128);
            buffer.fill(0);
            let working_buffer = this.buffer.subarray(start, start + 128);
            /*
            reading is in bytes, need 2 do bitwise operations to get & edit bits
            */
            // iterate through each 128 bit line
            let bytes_array = [];
            for (let i = 0; i < 16; i++) {
                // iterate through every bit of a current byte
                for (let j = 7; j >= 0; j--) {
                    // iterate through each byte, getting bit k from each byte in the line
                    let bit_array = [];
                    for (let k = 0; k < 8; k++) {
                        // get byte index
                        // i is the line index, j is the bit index, k is the byte index
                        // 8 bits per byte, 16 bytes per line, need to get j bit from k byte on i line
                        let byte_index = k * 16 + i;
                        // get bit
                        let bit = this.#getBit(working_buffer[byte_index],j);
                        bit_array.push(bit);
                    }
                    let byte = this.#buildByte(bit_array);
                    bytes_array.push(byte);
                }
            }
            rows[i] = Buffer.concat(bytes_array);

        }
        // combine rows into buffer
        let buffer = Buffer.concat(rows);
        return buffer;
    }
}

// exports
module.exports = {
    Renderer: Renderer,
    Item: Item
};