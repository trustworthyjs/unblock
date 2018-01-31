import React from 'react'
import { Line } from '@nivo/line'
import {connect} from 'react-redux'
import {getEntriesDb} from '../store'

/*
{
  "tones":
  [
    {"score":0.588912,"tone_id":"joy","tone_name":"Joy"},
  {"score":0.815157,"tone_id":"tentative","tone_name":"Tentative"}]
}
*/


let info = [
  {
    "id": "joy",
    "color": "hsl(5, 70%, 50%)",
    "data": [
      {
        "color": "hsl(118, 70%, 50%)",
        "x": "entry1",
        "y": 0.58
      },
      {
        "color": "hsl(157, 70%, 50%)",
        "x": "entry2",
        "y": 0.36
      },
      {
        "color": "hsl(108, 70%, 50%)",
        "x": "entry3",
        "y": 0.21
      },
      {
        "color": "hsl(261, 70%, 50%)",
        "x": "entry4",
        "y": 0.44
      },
      {
        "color": "hsl(298, 70%, 50%)",
        "x": "entry5",
        "y": 0.22
      },
      {
        "color": "hsl(164, 70%, 50%)",
        "x": "entry6",
        "y": 0.35
      },
      {
        "color": "hsl(340, 70%, 50%)",
        "x": "entry7",
        "y": 0.37
      },
      {
        "color": "hsl(350, 70%, 50%)",
        "x": "entry8",
        "y": 0.19
      },
      {
        "color": "hsl(45, 70%, 50%)",
        "x": "entry9",
        "y": 0.43
      }
    ]
  },
  {
    "id": "sadness",
    "color": "hsl(346, 70%, 50%)",
    "data": [
      {
        "color": "hsl(261, 70%, 50%)",
        "x": "entry1",
        "y": 0.57
      },
      {
        "color": "hsl(204, 70%, 50%)",
        "x": "entry2",
        "y": 0.55
      },
      {
        "color": "hsl(286, 70%, 50%)",
        "x": "entry3",
        "y": 0.40
      },
      {
        "color": "hsl(124, 70%, 50%)",
        "x": "entry4",
        "y": 0.29
      },
      {
        "color": "hsl(65, 70%, 50%)",
        "x": "entry5",
        "y": 0.2
      },
      {
        "color": "hsl(338, 70%, 50%)",
        "x": "entry6",
        "y": 0.0
      },
      {
        "color": "hsl(156, 70%, 50%)",
        "x": "entry7",
        "y": 0.30
      },
      {
        "color": "hsl(206, 70%, 50%)",
        "x": "entry8",
        "y": 0.57
      },
      {
        "color": "hsl(86, 70%, 50%)",
        "x": "entry9",
        "y": 0.42
      }
    ]
  }
]

class ToneGraph extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      toneGraphData: []
    }
  }

  componentDidMount(){
    this.props.getEntryData(this.props.user.id, this.prepData)
  }

  prepData = (entries) => {
    let graphData = []
    let tones = {
      anger: {"color": "hsl(207, 70%, 50%)"},
      fear: {"color": "hsl(97, 70%, 50%)"},
      joy: {"color": "hsl(352, 70%, 50%)"},
      sadness: {"color": "hsl(272, 70%, 50%)"},
      analytical: {"color": "hsl(119, 70%, 50%)"},
      confident: {"color": "hsl(163, 70%, 50%)"},
      tentative: {"color": "hsl(90, 70%, 50%)"}
    }
    for (let tone in tones) {
      if (tones.hasOwnProperty(tone)){
        let entryData = []
        entries.forEach((entry) => {
          let value = entry.tones.find((toneIn) => {
            return toneIn.tone_id === tone
          })
          entryData.push({
            "x": `${new Date(entry.savedAt)}`,
            "y": value ? value.score : 0,
          })
        })
        graphData.push({
          "id": tone,
          "color": tones[tone].color,
          "data": entryData
        })
      }
    }
    this.setState({
      toneGraphData: graphData
    })
  }

  render () {
    return (
      <div className="container">
        <h1>This is a graph of your tones over time</h1>
        {this.state.toneGraphData && this.state.toneGraphData.length > 0 &&
          <Line
            data={this.state.toneGraphData}
            width={1000}
            height={500}
            margin={{
                "top": 35,
                "right": 110,
                "bottom": 50,
                "left": 60
            }}
            minY="auto"
            axisBottom={{
                "orient": "bottom",
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "country code",
                "legendOffset": 36,
                "legendPosition": "center"
            }}
            axisLeft={{
                "orient": "left",
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "count",
                "legendOffset": -40,
                "legendPosition": "center"
            }}
            lineWidth={4}
            dotSize={10}
            dotColor="inherit:darker(0.3)"
            dotBorderWidth={2}
            dotBorderColor="#ffffff"
            enableDotLabel={true}
            dotLabel="y"
            dotLabelYOffset={-12}
            enableArea={true}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
            legends={[
                {
                    "anchor": "bottom-right",
                    "direction": "column",
                    "translateX": 100,
                    "itemWidth": 80,
                    "itemHeight": 20,
                    "symbolSize": 12,
                    "symbolShape": "circle"
                }
            ]}
          />
        }
      </div>
    )
  }
}

const mapState = (state) => {
  return {
    allEntries: state.allEntries,
    user: state.user
  }
}

const mapDispatch = (dispatch) => {
  return {
    getEntryData: (userId, dataFunc) => {
      return dispatch(getEntriesDb(userId))
      .then((actionType) => {
        dataFunc(actionType.entries)
      })
    },
  }
}

export default connect(mapState, mapDispatch)(ToneGraph)
