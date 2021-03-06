import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Quill from 'quill'
import { setTimeout, clearTimeout } from 'timers';
import { getEntryDb, createEntryDb, saveEntryDb, toggleSubmitPopupThunk, updateValues, resetValues } from '../store'
import { default as SubmitEntryPopup } from './SubmitEntryPopup'
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import { withRouter } from 'react-router'
import SettingsDrawer from './SettingsDrawer'
import Paper from 'material-ui/Paper';
import Alarm from 'material-ui/svg-icons/action/alarm'
import ActionAndroid from 'material-ui/svg-icons/action/android';
import Divider from 'material-ui/Divider'
import IconButton from 'material-ui/IconButton'
import Settings from 'material-ui/svg-icons/action/settings'

//util functions
function shuffle(a) {
  if (a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  } else return [];
}

function countWords(str) {
  let numWords = 0;
  str.split(' ').forEach(index => {
    if (index) numWords++;
  })
  return numWords;
}

/**
 * COMPONENT
 */
export class UserHome extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      timeout: null,
      showPopup: false,
      bounds: {},
      strokeSinceSave: 0,
      editor: '',
      entryToSubmit: {},
      dialogOpen: true,
      settingsOpen: false,
      timerStarted: false,
      currentPrompt: '',
      isSubmitting: false
    }
    this.interval = '';
  }


  setEditor = (editor) => {
    this.setState({ editor })
  }

  shouldComponentUpdate() {
    if (this.state.isSubmitting) {
      return false;
    }
    return true;
  }

  componentDidMount() {
    if (!this.state.isSubmitting){
    this.props.dispatchResetToDefault();
    var toolbarOptions = [
      { 'size': ['small', false, 'large', 'huge'] },
      'bold', 'italic', 'underline',
      { 'list': 'ordered' }, { 'list': 'bullet' },
      'link']
    // let shuffledPrompts = shuffle(this.props.editorValues.promptArrayFree)
    var options = {
      //debug: 'info',
      placeholder: 'Start writing...',
      theme: 'snow',
      modules: {
        toolbar: false
      }
    };
    var editor = new Quill('.editor', options);
    this.setEditor(editor)

    //DO NOT DELETE THIS CODE. MAY BE USED IN FUTURE.
    //disable delete
    // editor.keyboard.addBinding({
    //   key: 'Backspace',
    //   shiftKey: null,
    //   handler: function (range, context) {
    //     //do nothing
    //   }
    // });

    //DO NOT DELETE THIS CODE. MAY BE USED IN FUTURE.
    //disable selections and cursor change
    // editor.on('selection-change', function (range, oldRange, source) {
    //   if (range) {
    //     editor.getLength() - 1 !== range.index && editor.blur()
    //   }
    // });

    //disable spellcheck
    editor.root.spellcheck = false;
    editor.root.focus();
    editor.root.blur();

    // pre-populating the editor with existing entries
    if ((this.props.existingEntry !== '' && this.props.existingEntry !== undefined) && (!this.props.existingEntryLoading && this.props.existingEntryLoading !== undefined)) {
        editor.setText(this.props.existingEntry)
        this.props.getEntry(this.props.existingEntryId)
    }

    let userHome = this
    let toggleBetween = true

    editor.on('text-change', function (delta, oldDelta, source) {
      //counts the words in the editor and sets the number on state if it's different.
      let editorText = editor.getText();
      let numWords = countWords(editorText) - 1;
      if (userHome.props.editorValues.wordsWritten !== numWords) {
        userHome.props.dispatchWordsWritten(numWords);
      }

      const { timeout } = userHome.state
      clearTimeout(timeout)
      userHome.setState({
        showPopup: false,
        strokeSinceSave: userHome.state.strokeSinceSave + 1
      })

      //get the text and formatted text, send it through a thunk
      if (userHome.state.strokeSinceSave > 10) {
        let editedEntry = {
          id: +userHome.props.singleEntry.id,
          content: editor.getText(),
          formattedContent: editor.getContents().ops[0].insert
        }
        userHome.props.saveEntry(editedEntry)
        userHome.setState({
          strokeSinceSave: 0
        })
      }
      userHome.setState({
        timeout: setTimeout(() => {
          var range = editor.getSelection()
          if (range) {
            if (range.length === 0) {
              userHome.setState({
                bounds: editor.getBounds(range.index)
              })
            } else {
              var text = editor.getText(range.index, range.length);
            }
          }
          if (userHome.props.singleEntry.mode === "freeWrite"){
            if (userHome.props.editorValues.shuffledPromptsFree.length && !userHome.state.isSubmitting) {
              userHome.setState({
                showPopup: true,
                currentPrompt: userHome.props.editorValues.shuffledPromptsFree.pop()
              })
            }
          }
          else if (userHome.props.singleEntry.mode === "mindfulJournal"){
            if (userHome.props.editorValues.shuffledPromptsMind.length && !userHome.state.isSubmitting) {
              userHome.setState({
                showPopup: true,
                currentPrompt: userHome.props.editorValues.shuffledPromptsMind.pop()
              })
            }
          }
          else if (userHome.props.singleEntry.mode === "custom"){
            if (userHome.props.editorValues.shuffledPromptsFree.length && !userHome.state.isSubmitting || userHome.props.editorValues.shuffledPromptsMind.length && !userHome.state.isSubmitting) {
              userHome.setState({
                showPopup: true,
                currentPrompt: toggleBetween ? userHome.props.editorValues.shuffledPromptsFree.pop() : userHome.props.editorValues.shuffledPromptsMind.pop()
              })
              toggleBetween = !toggleBetween
            }
          }


        }, 3000),
        timerStarted: true
      })
      if (!userHome.state.interval && userHome.props.singleEntry.settings.timer) {
        userHome.startTimerCountdown();
      }
    });
  }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  startTimerCountdown = () => {
    if (!this.interval) {
      this.interval = setInterval(() => {
        let newSeconds = this.props.editorValues.timer - 1;
        if (newSeconds < 0) {
          clearInterval(this.interval)
          this.state.editor.enable(false);
        }
        else {
          this.props.dispatchTimerCountdown(newSeconds)
        }
      }, 1000)
    }
  }

  toggleSubmitPopup = () => {
    clearInterval(this.interval)
    let currentState = this.props.showSubmitPopup
    this.props.setSubmitPopup(!currentState)
    let editedEntry = {
      id: +this.props.singleEntry.id,
      content: this.state.editor.getText(),
      formattedContent: this.state.editor.getContents().ops[0].insert,
      mode: this.props.singleEntry.mode
    }
    this.setState({ entryToSubmit: editedEntry, isSubmitting: true })
  }

  handleModeSelection = (event, clickedOutside) => {
    this.setState({ dialogOpen: false })
    let mode;
    if (event.target) mode = event.target.title;
    else mode = 'custom'
    //this will need to be hooked up with a prompt from the landing page to determine which notebook (old or new) it goes into
    this.props.createEntry({
      mode
    })
  }

  toggleSettingsVisible = () => {
    this.setState({ settingsOpen: !this.state.settingsOpen })
  }

  clearEntry = () => {
    const updatedEntry = Object.assign({}, this.props.singleEntry, { content: null, formattedContent: null })
    this.props.saveEntry(updatedEntry)
    this.state.editor.setContents([])
  }

  /*eslint-disable complexity */

  render() {

    // if (this.props.existingEntry !== '' && !this.props.existingEntryLoading) {
    //   this.state.editor.setText(this.props.existingEntry)
    // }

    const { email } = this.props
    const { bounds } = this.state
    const editorValues = this.props.editorValues;

    //formats the total seconds on the timer to a string -> 'm:ss'
    const timer = `${Math.floor(editorValues.timer / 60)}:${('0' + editorValues.timer % 60).slice(-2)}`

    //formats the words written and the wordcount goal to a string -> 'WW/WC'
    const wordRatio = `${editorValues.wordsWritten}/${editorValues.wordCount}`

    const singleEntry = this.props.singleEntry
    const styles = {
      top: bounds.top + 55,    // computed based on child and parent's height
      left: bounds.left > 800 ? 800 : bounds.left + 10,   // computed based on child and parent's width
      right: bounds.right - 20,
      bottom: bounds.bottom + 300,
      height: '50px',
      width: '170px',
      "zIndex": '10',
      'alignItems': 'center',
      'alignContent': 'center',
      display: 'flex',
      'justifyContent': 'center',
    }
    const SubmitEntryPopupWithRouter = withRouter(SubmitEntryPopup)
    const modeDialog = (
      <Dialog
        title="Select a writing mode"
        open={this.state.dialogOpen}
        contentClassName={'dialog-container'}
        modal={false}
        onRequestClose={this.handleModeSelection}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>

          <div className="mode-btn-container">
            <button className="mode-btn" id="free-write-btn" title="freeWrite" onClick={this.handleModeSelection} />
            <div className="mode-btn-label" title="freeWrite" onClick={this.handleModeSelection}>Free Writing</div>
          </div>

          <div className="mode-btn-container">
            <button className="mode-btn" id="mindful-journal-btn" title="mindfulJournal" onClick={this.handleModeSelection} />
            <div className="mode-btn-label" title="mindfulJournal" onClick={this.handleModeSelection}>Mindfulness Journal</div>
          </div>

          <div className="mode-btn-container">
            <button className="mode-btn" id="custom-btn" title="custom" onClick={this.handleModeSelection} />
            <div className="mode-btn-label" title="custom" onClick={this.handleModeSelection}>Custom</div>
          </div>

        </div>
      </Dialog>
    )

    //determine if timer should be shown
    const showTimer = () => {
      if (singleEntry.settings) {
        return singleEntry.settings.timer;
      }
      return false
    }

    //determine if word count should be shown
    const showWordCount = () => {
      if (singleEntry.settings) {
        return singleEntry.settings.wordCount;
      }
      return false
    }

    //determine if prompts should be shown
    const showPrompts = () => {
      if (singleEntry.settings) {
        return singleEntry.settings.prompts;
      }
      return false
    }

    return (
      <div className="new-entry-container">

       <div className={`editor-container`} style={{marginTop: '-4rem'}}>
        { (this.props.existingEntryId === 0 && !this.props.existingEntryLoading) && modeDialog }
        <div className={this.props.userTheme} style={
          {
          width: '100vw',
          height: '100vh',
          right: '0rem',
          position: 'absolute',
          top: '2.3rem',
          zIndex: '-10'}} />
        <div className='settings-values'>
          {showTimer() &&
            <FlatButton
              label={timer}
              labelPosition="before"
              style={{color: '#1595A3'}}
              icon={<Alarm />}
            />
          }
          {showWordCount() &&
            <FlatButton
              label={wordRatio}
              style={{color: '#1595A3'}}
            />
          }
          {showPrompts() &&
            <FlatButton
              label={'Prompts Enabeled'}
              style={{color: '#1595A3'}}
            />
          }

          <FlatButton label={'Submit Entry'} onClick={this.toggleSubmitPopup} secondary={true} />
            {this.props.showSubmitPopup &&
            <SubmitEntryPopupWithRouter entry={this.state.entryToSubmit} />
            }

          <FlatButton label={'Clear Entry'} onClick={this.clearEntry} secondary={true} />

          <IconButton onClick={this.toggleSettingsVisible} className="settings-icon" >
            <Settings color="#37474F" hoverColor="#ACD3F2" />
          </IconButton>
        </div>
        <div id="editor-with-settings" >
          <div className="editor-prompt" style={{borderTop: '2px rgba(201, 200, 200, 0.5) groove'}}>
            {this.state.showPopup && showPrompts() &&
              <Paper className="popup" style={styles}>
                {this.state.currentPrompt}
              </Paper>
            }

            <div className={`editor`} />
          </div>

          <SettingsDrawer
            toggle={this.toggleSettingsVisible}
            visible={this.state.settingsOpen}
          />
        </div>

      </div>
      </div>
    )
  }
}


/**
 * CONTAINER
 */
const mapState = (state) => {
  return {
    email: state.user.email,
    singleEntry: state.singleEntry,
    showSubmitPopup: state.submitPopup,
    editorValues: {
      timer: state.editorValues.timer,
      wordsWritten: state.editorValues.wordsWritten,
      wordCount: state.editorValues.wordCount,
      shuffledPromptsFree: shuffle(state.editorValues.promptArrayFree),
      shuffledPromptsMind: shuffle(state.editorValues.promptArrayMind)
    },
    userTheme: state.user.theme
  }
}

const mapDispatch = (dispatch) => {
  return {
    getEntry: (entryId) => {
      dispatch(getEntryDb(entryId))
    },
    createEntry: (newEntry) => {
      dispatch(createEntryDb(newEntry))
    },
    saveEntry: (editedEntry) => {
      dispatch(saveEntryDb(editedEntry))
    },
    setSubmitPopup: (state) => {
      dispatch(toggleSubmitPopupThunk(state))
    },
    dispatchTimerCountdown: newSeconds => {
      dispatch(updateValues({ timer: newSeconds }))
    },
    dispatchResetToDefault: () => {
      dispatch(resetValues());
    },
    dispatchWordsWritten: (numWords) => {
      dispatch(updateValues({ wordsWritten: numWords }));
    }
  }
}

export default connect(mapState, mapDispatch)(UserHome)

/**
 * PROP TYPES
 */
UserHome.propTypes = {
  email: PropTypes.string
}
