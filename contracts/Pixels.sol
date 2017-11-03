pragma solidity ^0.4.11;

contract Pixels {
  // Pixel owner
  struct PixelOwner {    
    address owner;
    string rgb;
    bytes32 memo;
    string url;
    bool owned;
  }

  // 100 x 100 GRID
  uint constant GRID_SIZE = 32;
  uint constant PIXEL_PRICE = 10000000000000000; // 0.01 ETH

  // Multi dimensional array depicting pixel ownership
  // Can't use constants to set fixed length arrays in solidity v0.4.18^
  PixelOwner[100][100] pixelOwners;  

  // Buy pixel on x, y coordinate
  function buyPixel(uint x, uint y, string rgb, bytes32 memo, string url) payable {    
    uint amountSent = msg.value;
    address sender = msg.sender;   

    // If no one owns the pixel
    // Add pixel ownership
    if (!pixelOwners[y][x].owned && amountSent >= PIXEL_PRICE) {
      pixelOwners[y][x] = PixelOwner({
        owner: msg.sender,
        rgb: rgb,
        memo: memo,
        url: url,
        owned: true
      });
    } else {
      // Else refund $$
      sender.transfer(amountSent);
    }
  }

  function getPixel(uint x, uint y) constant returns (address, string, bytes32, string, bool) {
    // Just store in memory
    PixelOwner storage po = pixelOwners[y][x];

    // Can't return custom object, so just gonna return tuple
    return (po.owner, po.rgb, po.memo, po.url, po.owned);
  }

  function getPixelColor(uint x, uint y) constant returns (string) {
    // Just store in memory
    PixelOwner storage po = pixelOwners[y][x];
    return po.rgb;
  }

  function getGridSize() constant returns (uint) {
    return GRID_SIZE;
  }
}
