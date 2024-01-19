// class for oled, it holds state and provides methods to control the oled
// and display information on it
// ---------------------------------------------------------------------------

class OLED {
    constructor(device) {
        this.device = device;
        // build the buffer
        // 128x32 in size, four rows of 128x8
        this.buffer = new Buffer.alloc(512);
        this.buffer.fill(0);
    }

    update(buffer) {
        // update the buffer
        this.buffer = buffer;
    }

    // send the buffer to the oled
    send() {
        // send the buffer to the oled
        this.device.write([0, 0x16]);
        for (let i = 0; i < 16; i++) {
            let current_line = [0x0];
            for (let j = 0; j < 32; j++) {
                current_line.push(this.buffer[(Number(i) * 32) + Number(j)]);
            }
            this.device.write(current_line);
        }
        this.device.write([0, 0x32]);
    }

    connect() {

    }
}

// exports
module.exports = {
    OLED: OLED
};