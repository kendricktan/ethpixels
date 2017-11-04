pragma solidity ^0.4.11;


contract Pixels {
  // Pixel owner
  struct PixelOwner {    
    address owner;
    bytes3 rgb; // "0xffffff"
    bytes32 memo;    
    bool owned;
  }

  // 32 x 32 GRID
  uint constant GRID_SIZE = 32;
  uint constant PIXEL_PRICE = 10000000000000000; // 0.01 ETH

  // Multi dimensional array depicting pixel ownership
  // Can't use constants to set fixed length arrays in solidity v0.4.18^
  PixelOwner[32][32] pixelOwners;  

  // Buy pixel on x, y coordinate
  function buyPixel(uint x, uint y, bytes3 rgb, bytes32 memo) public payable {    
    uint amountSent = msg.value;
    address sender = msg.sender;   

    // If no one owns the pixel
    // Add pixel ownership
    if (!pixelOwners[y][x].owned && amountSent >= PIXEL_PRICE) {
      pixelOwners[y][x] = PixelOwner({
        owner: msg.sender,
        rgb: rgb,
        memo: memo,
        owned: true
      });
    } else {
      // Else refund $$
      sender.transfer(amountSent);
    }
  }

  // Get all pixels on a row
  function getRowPixelsColorDump (uint row) public constant returns (bytes3[32]) {
    bytes3[32] memory b;

    for (uint x = 0; x < 32; x++) {
      // White by default
      if (!pixelOwners[row][x].owned) {
        b[x] = 0xffffff;
      } else {
        b[x] = pixelOwners[row][x].rgb;
      }
    }

    return b;
  }

  function getPixel(uint x, uint y) public constant returns (bool, address, bytes32) {
    // Just store in memory
    PixelOwner storage po = pixelOwners[y][x];

    // Can't return custom object, so just gonna return tuple
    return (po.owned, po.owner, po.memo);
  }

  function getPixelColor(uint x, uint y) public constant returns (bytes3) {
    // Just store in memory
    PixelOwner storage po = pixelOwners[y][x];
    return po.rgb;
  }

  function getGridSize() public pure returns (uint) {
    return GRID_SIZE;
  }
}
