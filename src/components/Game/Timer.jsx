import React, { useState, useEffect } from 'react';
import './Timer.css';

class Timer extends React.Component {
  constructor(props) {
    super(props);

    // Try to load saved timer state from localStorage
    let savedState = null;
    try {
      const savedTimerState = localStorage.getItem('werewolf_timer_state');
      if (savedTimerState) {
        savedState = JSON.parse(savedTimerState);
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
    }

    // Initialize state with saved values or defaults
    this.state = {
      timeLeft: savedState ? savedState.timeLeft : props.initialTime,
      isRunning: savedState ? savedState.isRunning : true,
      completed: savedState ? savedState.completed : false,
      startTime: savedState ? savedState.startTime : Date.now(),
      pausedAt: savedState ? savedState.pausedAt : null
    };

    this.timerInterval = null;
  }

  componentDidMount() {
    // If timer was running when page was refreshed, calculate elapsed time
    if (this.state.isRunning && !this.state.completed) {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - this.state.startTime) / 1000);

      // Adjust timeLeft based on elapsed time
      const newTimeLeft = Math.max(0, this.state.timeLeft - elapsedSeconds);

      if (newTimeLeft <= 0) {
        this.setState({
          timeLeft: 0,
          completed: true,
          isRunning: false
        }, () => {
          this.saveTimerState();
          if (this.props.onComplete) {
            this.props.onComplete();
          }
        });
      } else {
        this.setState({ timeLeft: newTimeLeft }, () => {
          this.startTimer();
        });
      }
    } else if (this.state.isRunning) {
      this.startTimer();
    }
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
          return { timeLeft: 0, completed: true };
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
      isRunning: true,
      completed: false
    }, this.startTimer);
  }

  cancelTimer = () => {
    this.stopTimer();
    this.setState({ completed: false });
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
      <div className={`timer ${this.state.completed ? 'completed' : ''}`} onClick={() => this.state.completed && this.cancelTimer()}>
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
        {this.state.completed && (
          <div style={{ marginTop: '0.5rem', textAlign: 'center', color: 'var(--primary-color)', fontWeight: 'bold' }}>
            Temps écoulé ! Cliquez n'importe où pour fermer.
          </div>
        )}
      </div>
    );
  }
}

export default Timer;
