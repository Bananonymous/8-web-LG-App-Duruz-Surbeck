import React, { useState, useEffect } from 'react';
import './Timer.css';

class Timer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timeLeft: props.initialTime,
      isRunning: true
    };
    this.timerInterval = null;
  }

  componentDidMount() {
    this.startTimer();
  }

  componentWillUnmount() {
    this.stopTimer();
  }

  startTimer = () => {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.setState(prevState => {
        if (prevState.timeLeft <= 1) {
          this.stopTimer();
          if (this.props.onComplete) {
            this.props.onComplete();
          }
          return { timeLeft: 0 };
        }
        return { timeLeft: prevState.timeLeft - 1 };
      });
    }, 1000);
  }

  stopTimer = () => {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  toggleTimer = () => {
    if (this.state.isRunning) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
    this.setState(prevState => ({ isRunning: !prevState.isRunning }));
  }

  resetTimer = () => {
    this.stopTimer();
    this.setState({
      timeLeft: this.props.initialTime,
      isRunning: true
    }, this.startTimer);
  }

  cancelTimer = () => {
    this.stopTimer();
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  }

  // Format time as MM:SS
  formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  render() {
    return (
      <div className="timer">
        <div className="timer-display">{this.formatTime(this.state.timeLeft)}</div>
        <div className="timer-controls">
          <button
            className="timer-btn"
            onClick={this.toggleTimer}
          >
            {this.state.isRunning ? 'Pause' : 'Reprendre'}
          </button>
          <button
            className="timer-btn"
            onClick={this.resetTimer}
          >
            Réinitialiser
          </button>
          <button
            className="timer-btn timer-btn-cancel"
            onClick={this.cancelTimer}
          >
            Terminer
          </button>
        </div>
      </div>
    );
  }
}

export default Timer;
