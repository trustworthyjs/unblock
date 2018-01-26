import React, {Component} from 'react'
import Radar from 'react-d3-radar'
import ReactToolTip from 'react-tooltip'
import {connect} from 'react-redux'
import {Popup} from './Popup'

export class PersonalityRadarChart extends Component {
    
    constructor() {
        super()
        this.state = {
            isHovering: false,
            popupX: 0,
            popupY: 0,
            chartWidth: 500,
            chartHeight: 500
        }
        this.handleHover = this.handleHover.bind(this);
    }
    
    //this is a workaround for the react-d3-radar -> the hover radius was way too big, this cuts the 
    // radius down to just 5 pixels around the actual circle
    handleHover(point) {
        let rect;
        var svg = document.getElementsByTagName('svg');
        
        rect = svg[0].getBoundingClientRect();
        let mouseXInChart = window.event.clientX - (this.state.chartWidth / 2 + rect.left)
        let mouseYInChart = window.event.clientY - (this.state.chartHeight / 2 + rect.top)
        if (point &&
            (mouseXInChart > Math.floor(point.x) - 5 && mouseXInChart < Math.floor(point.x) + 5) &&
            (mouseYInChart > Math.floor(point.y) - 5 && mouseYInChart < Math.floor(point.y) + 5)) {
                this.setState({
                    isHovering: true,
                    popupX: window.event.clientX,
                    popupY: window.event.clientY
                })             
        } else {
            this.setState({
                isHovering: false
            })
        }
        
    }

    
    render() {
        var data = this.props.data
        
        if (data.personality) {

            const personality = data.personality;

            let variables = [];
            let values = {};
            personality.forEach(trait => {
                variables.push({key: trait.name, label: trait.name})
                values[trait.name] = trait.percentile * 100;
            })
            
            return (
                <div>
                {this.state.isHovering && 
                    <Popup x={this.state.x} y={this.state.y} message={'hitting a point'} />
                }
                <Radar
                    width={this.state.chartWidth}
                    height={this.state.chartHeight}
                    padding={70}
                    domainMax={100}
                    highlighted={null}
                    onHover={this.handleHover}
                    data={{
                        variables,
                        sets: [
                            {
                                key: 'me',
                                label: 'My Scores',
                                values
                            }
                        ]
                    }}
                />
                </div>
            )
        } else {
            return null;
        }
    }
}

/**
 * CONTAINER
 */
const mapState = ({data}) => ({data})

export default connect(mapState)(PersonalityRadarChart)