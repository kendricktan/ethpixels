import React, { Component } from 'react'
import PixelContract from '../build/contracts/Pixels.json'
import getWeb3 from './utils/getWeb3'
import { Layer, Rect, Line, Stage } from 'react-konva'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

const pixelSize = 20

// Given canvas size, compute coordinates
// Need to draw grid (for konva)
const getGridCoordinate = canvasSize => {
  // Draw inner grid
  let linePoints = []
  let x = 0
  for (let y = 0; y < canvasSize; y += pixelSize) {
    linePoints.push(x)
    linePoints.push(y)
    linePoints.push(canvasSize)
    linePoints.push(y)
    linePoints.push(canvasSize)
    linePoints.push(y + pixelSize)
  }

  let y = canvasSize
  for (let x = canvasSize; x > 0; x -= pixelSize) {
    linePoints.push(x)
    linePoints.push(y)
    linePoints.push(x)
    linePoints.push(0)
    linePoints.push(x - pixelSize)
    linePoints.push(0)
  }

  // Draw outer grid
  linePoints.push(0)
  linePoints.push(canvasSize)
  linePoints.push(canvasSize)
  linePoints.push(canvasSize)
  linePoints.push(canvasSize)
  linePoints.push(0)
  linePoints.push(0)
  linePoints.push(0)

  return linePoints
}

// Pixels on the canvas
class Pixel extends Component {
  handleHover = () => {    
    this.props.updateHoverPixelInfo(this.props.x, this.props.y);
  }
  render () {
    return (
      <Rect
        x={this.props.x * pixelSize}
        y={this.props.y * pixelSize}
        width={pixelSize}
        height={pixelSize}
        fill={this.props.color}
        onMouseEnter={this.handleHover}
      />
    )
  }
}

class BuyPixelApp extends Component {
  constructor(props) {
    super(props)

    this.state = {
      x: 0,
      y: 0,
      rgb: '#000000',
      memo: '',      
    }
  }

  buyPixel = () => {
    const x = parseInt(this.state.x)
    const y = parseInt(this.state.y)
    console.log(this.state.rgb)
    const rgb = '0x' +  this.state.rgb.replace('#', '')
    const memo = this.state.memo

    // x, y
    if (isNaN(x) || isNaN(y)) {
      alert('incorrect x or y value')
      return
    }

    // error checking
    if (!/^0x[0-9A-F]{6}$/i.test(rgb)) {
      alert('incorrect rgb value')
      return
    }

    // empty memo
    if (memo === '') {
      alert('empty memo m8')
      return
    }

    const pixelInstance = this.props.pixelInstance
    const web3 = this.props.web3

    web3.eth.getAccounts((err, accounts) => {
      console.log(accounts)
      if (accounts.length == 0) {
        alert('your metamask account is locked, please unlock it')
        return
      }

      pixelInstance.buyPixel(x, y, rgb, web3.toHex(memo), {from: accounts[0], to: pixelInstance.address, value: web3.toWei(parseFloat(0.01), 'ether')})
      .then(() => {
        alert('bought your pixel, press the refresh button in around 30 seconds.')
      })
    })    
  }

  render () {
    return (
      <div>
        <strong>buy a pixel</strong><br/>
        x: <input placeholder='5' onChange={(e) => this.setState({x: e.target.value})}/><br/>
        y: <input placeholder='7' onChange={(e) => this.setState({y: e.target.value})}/><br/>
        rgb: <input type='color' placeholder='00ff00' onChange={(e) => this.setState({rgb: e.target.value})}/><br/>
        memo: <input placeholder='good day m8' onChange={(e) => this.setState({memo: e.target.value})}/><br/>        
        <button onClick={this.buyPixel}>buy me this pixel</button>
      </div>
    )
  }
}

// Main app
class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      canvasItems: {},
      canvasGridLines: [],
      canvasSize: 0,
      pixelInstance: null,
      web3: null,
      hoverMemo: '',
      hoverURL: '',
      hoverAddress: '',
      hoverXY: ''
    }
  }

  componentDidMount = async () => {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.
    try {
      const results = await getWeb3
      this.setState({ web3: results.web3 })
      this.instantiateContract()
    } catch (err) {
      alert('web3 not found, please use a web3 compatiable browser, or install metamask.')
      console.log(err)
      console.log('Error finding web3.')
    }
  }

  instantiateContract = async () => {
    const contract = require('truffle-contract')
    const pixelContract = contract(PixelContract)
    pixelContract.setProvider(this.state.web3.currentProvider)

    try {
      const instance = await pixelContract.deployed()
      const result = await instance.getGridSize()
  
      // Result is BigNumber object
      const canvasSize = result.c[0]  
      const linePoints = getGridCoordinate(canvasSize * pixelSize)      
      const canvasGridLines = <Line key={'line'} points={linePoints} stroke='black' strokeWidth={1} />
  
      // Construct initial canvas (all white)
      let canvasItems = {}
      for (let x = 0; x < canvasSize; x++) {
        canvasItems[x] = {}
        for (let y = 0; y < canvasSize; y++) {
          canvasItems[x][y] = '#ffffff'
        }
      }
  
      this.setState({
        pixelInstance: instance,
        canvasItems: canvasItems,  
        canvasSize: canvasSize,
        canvasGridLines: canvasGridLines
      }, () => this.updatePixels())
    } catch (err) {
      // JSON RPC error = no web3
      if (err.toString().indexOf('RPC') !== -1) {
        alert('web3 not detected, please use a compatiable web3 browser or install the metamask extension')
      } else {
        alert('ethpixel has only been deployed on rinkeby testnet, please change your network in web3 or metamask to rinkeby')
      }
    }
  }

  updateHoverPixelInfo = async (x, y) => {
    const web3 = this.state.web3
    const pixelInstance = this.state.pixelInstance

    const result = await pixelInstance.getPixel(x, y)

    const owned = result[0]
    const address = result[1]      
    const memo = web3.toAscii(result[2])

    if (owned){
      this.setState({
        hoverMemo: memo,
        hoverAddress: address,
        hoverXY: x + ', ' + y
      })
    }

    else {
      this.setState({
        hoverMemo: 'free for purchase',
        hoverAddress: '',
        hoverXY: x + ', ' + y
      })
    }
  }

  updatePixels = async () => {
    const pixelInstance = this.state.pixelInstance

    // Get them by row so it doesn't hog shit up
    let pixelPromises = []
    for (let y = 0; y < this.state.canvasSize; y++){
      pixelPromises.push(pixelInstance.getRowPixelsColorDump(y))
    }

    // Map over all promises
    const results = await Promise.all(pixelPromises)
    let canvasItems = this.state.canvasItems
    
    for (let x = 0; x < this.state.canvasSize; x++) {
      for (let y = 0; y < this.state.canvasSize; y++) {
        // it's [y][x] in the contract lel
        canvasItems[x][y] = results[y][x].replace('0x', '#');
      }        
    }

    this.setState({
      canvasItems: canvasItems
    })
  }  

  render () {
    let canvasItems = []
    for (let x = 0; x < this.state.canvasSize; x++) {
      for (let y = 0; y < this.state.canvasSize; y++) {             
        canvasItems.push(
          <Pixel x={x} y={y} color={this.state.canvasItems[x][y]} updateHoverPixelInfo={this.updateHoverPixelInfo}/>
        )        
      }        
    }
    canvasItems.push(this.state.canvasGridLines)

    return (
      <div>
        <div className="pure-g" style={{padding: '10px'}}>
          <div className="pure-u-1-5">
            <strong>pixel owner information</strong><br/>
            x, y: {this.state.hoverXY}<br/>
            memo: {this.state.hoverMemo}<br/>
            address: {this.state.hoverAddress}<br/>            
          </div>
          <div className="pure-u-1-5">
            <BuyPixelApp
              web3={this.state.web3} pixelInstance={this.state.pixelInstance}
            />
          </div>
        </div>
        <hr/>
        <button style={{marginLeft: '10px'}} onClick={this.updatePixels}>Refresh Pixels</button>
        <div className='canvas-container'>          
          <Stage width={this.state.canvasSize * pixelSize} height={this.state.canvasSize * pixelSize}>
            <Layer>
              {canvasItems}
            </Layer>
          </Stage>          
        </div>
        <hr/>
        <div style={{paddingLeft: '10px'}}>
          Made by Kendrick Tan. <a href="http://github.com/kendricktan/ethpixels">Source Code</a>
        </div>
      </div>
    )
  }
}

export default App
