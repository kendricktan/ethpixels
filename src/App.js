import React, { Component } from 'react'
import PixelContract from '../build/contracts/Pixels.json'
import getWeb3 from './utils/getWeb3'
import { Layer, Rect, Line, Stage } from 'react-konva'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

const pixelSize = 25

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
      rgb: '',
      memo: '',
      url: ''
    }
  }

  buyPixel = () => {
    const x = parseInt(this.state.x)
    const y = parseInt(this.state.y)
    const rgb = this.state.rgb
    const memo = this.state.memo
    const url = this.state.url

    const pixelInstance = this.props.pixelInstance
    const web3 = this.props.web3

    web3.eth.getAccounts((err, accounts) => {
      pixelInstance.buyPixel(x, y, rgb, memo, url, {from: accounts[0], to: pixelInstance.address, value: web3.toWei(parseFloat(0.01), 'ether')})      
    })    
  }

  render () {
    return (
      <div>
        buy a pixel<br/>
        x: <input onChange={(e) => this.setState({x: e.target.value})}/><br/>
        y: <input onChange={(e) => this.setState({y: e.target.value})}/><br/>
        rgb: <input onChange={(e) => this.setState({rgb: e.target.value})}/><br/>
        memo: <input onChange={(e) => this.setState({memo: e.target.value})}/><br/>
        url: <input onChange={(e) => this.setState({url: e.target.value})}/><br/>
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

  componentWillMount () {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.
    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3
        })

        // Instantiate contract once web3 provided.
        this.instantiateContract()
      })
      .catch((err) => {
        console.log(err)
        console.log('Error finding web3.')
      })
  }

  instantiateContract () {
    const contract = require('truffle-contract')
    const pixelContract = contract(PixelContract)
    pixelContract.setProvider(this.state.web3.currentProvider)

    pixelContract.deployed()
    .then((instance) => {
      instance.getGridSize().then((result) => {        
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
        })
      })
    })    
  }

  updateHoverPixelInfo = (x, y) => {
    const pixelInstance = this.state.pixelInstance

    pixelInstance.getPixel(x, y)
    .then((result) => {      
      const address = result[0]
      const rgb = result[1]
      const memo = result[2]
      const url = result[3]
      
      this.setState({
        hoverMemo: memo,
        hoverURL: url,
        hoverAddress: address,
        hoverXY: x + ', ' + y
      })
    })
  }

  updatePixels = () => {
    const pixelInstance = this.state.pixelInstance

    // LOL n^2
    for (let x = 0; x < this.state.canvasSize; x++) {
      for (let y = 0; y < this.state.canvasSize; y++) {
        pixelInstance.getPixelColor(x, y)
        .then((result) => {
          // Default value, ignore
          if (result !== '#ffffff') {            
            let curCanvas = this.state.canvasItems          
            curCanvas[x][y] = result
            this.setState({
              canvasItems: curCanvas
            })
          }          
        })
      }
    }
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
      <div className='canvas-container'>
        <div>
          pixel owner information<br/>
          x, y: {this.state.hoverXY}<br/>
          memo: {this.state.hoverMemo}<br/>
          address: {this.state.hoverURL}<br/>
          url: {this.state.hoverURL}<br/>
          <hr/>
        </div>
        <Stage width={this.state.canvasSize * pixelSize} height={this.state.canvasSize * pixelSize}>
          <Layer>
            {canvasItems}
          </Layer>
        </Stage>
        <button onClick={this.updatePixels}>Update pixels</button>
        <hr/>
        <BuyPixelApp web3={this.state.web3} pixelInstance={this.state.pixelInstance}/>
      </div>        
    )
  }
}

export default App
