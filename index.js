let HID = require ('node-hid');
let renderer = require('./renderer.js');
let OLED = require('./OLED/OLED.js');
let devices = null;
const KEYBOARD_NAME = 'Lily58';
const KEYBOARD_USAGE_ID = 0x61;
const KEYBOARD_USAGE_PAGE = 0xFF60;
const KEYBOARD_UPDATE_INTERVAL = 500;
let keyboard = null;
let device = null;
let find_board_loop = null;
let main_loop = null;

let health = 69000;
let max_health = 69000;

let mp = 10000;
let max_mp = 10000;

test_payload = [
    // 'reaper_normal', 128x32px
0x00, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x00, 0x00,
0x00, 0x00, 0x00, 0x00,
0x00, 0x04, 0x00, 0x00,
0x00, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x00, 0x00, 
0x00, 0x08, 0x00, 0x00,

0x00, 0x00, 0x00, 0x00,
0x00, 0x11, 0xcc, 0x00,
0x00, 0x17, 0xfc, 0x00,
0x00, 0x1f, 0x7c, 0x00,
0x00, 0x38, 0x0e, 0x00,
0x00, 0x30, 0x06, 0x00,
0x00, 0x30, 0x06, 0x00,
0x00, 0x70, 0x03, 0x00,
0x00, 0x60, 0x03, 0x00,
0x00, 0xf0, 0x03, 0x00,
0x00, 0xb0, 0x07, 0x00,
0x08, 0x30, 0x06, 0x00,
0x0d, 0x38, 0x0e, 0x00,
0x0d, 0x1e, 0x3c, 0x00,
0x0e, 0x0f, 0xf8, 0x20,
0x07, 0x01, 0xe0, 0x80,
0x07, 0x80, 0x07, 0x00,
0x03, 0xf0, 0xfc, 0x00,
0x01, 0xff, 0xe0, 0x00, 
0x00, 0x7f, 0x00, 0x00,
0x00, 0x00, 0x00, 0x00,
0x00, 0x00, 0x00, 0x00,
0x00, 0x00, 0x00, 0x00,
0x00, 0x00, 0x00, 0x00,
];


test_item = new renderer.Item(0, 0, 32, 32, Buffer.from(test_payload));
test_item_two = new renderer.Item(32, 0, 32, 32, Buffer.from(test_payload));
test_item_three = new renderer.Item(64, 0, 32, 32, Buffer.from(test_payload));
test_item_four = new renderer.Item(96, 0, 32, 32, Buffer.from(test_payload));
test_renderer = new renderer.Renderer();
test_renderer.items.push(test_item, test_item_two, test_item_three, test_item_four);
console.log(test_renderer.items);
test_buffer = test_renderer.render();
console.log(test_buffer);


let oled

function sendPayload(payload) {
    oled.update(payload);
    oled.send();
}


function getKeyboard() {
    devices = HID.devices();
    keyboard = devices.find((device) => {
        return device.product === KEYBOARD_NAME && device.usagePage === KEYBOARD_USAGE_PAGE && device.usage === KEYBOARD_USAGE_ID;
    });

    if (keyboard) {
        device = new HID.HID(keyboard.path);
        oled = new OLED.OLED(device);
        device.on("data", (data) => {
            //console.log(data);
        });
        device.on("error", (error) => {
            console.log(error);
        });
        console.log('Found keyboard');
    } else {
        console.log('Keyboard not found');
    }
}

function updateKeyboard() {
    if (device) {
        try {
            sendPayload(test_buffer);
        } catch (error) {
            console.log('Error writing to keyboard');
            device = null;
        }
    }
    else {
        findBoard();
    }
}
function findBoard(){
    if (!device) {
        getKeyboard();
    }
}

main_loop = setInterval(updateKeyboard, KEYBOARD_UPDATE_INTERVAL);



