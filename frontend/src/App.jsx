import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // Application state
  const [moments, setMoments] = useState([])
  const [settings, setSettings] = useState({
    interval: 100,      // Message batch size
    threshold: 0.3,     // Significance threshold
    allowedEmotes: ['❤️', '👍', '😢', '😡']  // Available emotes
  })

  // WebSocket connection setup
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws`)

    // Connection lifecycle handlers
    ws.onopen = () => {
      console.log('Connected to Server A')
      fetchSettings()
    }

    // Message handling
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'history') {
        setMoments(data.moments)  // Set historical data
      } else if (data.type === 'moment') {
        setMoments(prev => [...prev, data.data].slice(-10))  // Add new moment, maintain max 10
      }
    }

    // Cleanup on unmount
    return () => ws.close()
  }, [])

  // Settings management functions
  const fetchSettings = async () => {
    try {
      const responses = await Promise.all([
        fetch('/api/settings/interval'),
        fetch('/api/settings/threshold'),
        fetch('/api/settings/allowed-emotes')
      ])
      const [interval, threshold, allowedEmotes] = await Promise.all(
        responses.map(r => r.json())
      )
      setSettings({
        interval: interval.interval,
        threshold: threshold.threshold,
        allowedEmotes: allowedEmotes.allowedEmotes
      })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const updateSetting = async (setting, value) => {
    try {
      let body;
      if (setting === 'allowed-emotes') {
        body = { allowedEmotes: value };
      } else {
        body = { [setting]: value };
      }

      const response = await fetch(`/api/settings/${setting}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (response.ok) {
        const data = await response.json()
        // Update the correct state property based on the setting type
        if (setting === 'allowed-emotes') {
          setSettings(prev => ({ ...prev, allowedEmotes: data.allowedEmotes }))
        } else {
          setSettings(prev => ({ ...prev, [setting]: data[setting] }))
        }
      }
    } catch (error) {
      console.error(`Failed to update ${setting}:`, error)
    }
  }

  // UI Rendering
  return (
    <div className="app">
      {/* Settings Panel */}
      <div className="settings-panel">
        <h2> Settings</h2>
        <div className="setting-group">
          <label>
            Message Interval:
            <input
              type="number"
              min="1"
              value={settings.interval}
              onChange={(e) => updateSetting('interval', Number(e.target.value))}
            />
          </label>
        </div>
        <div className="setting-group">
          <label>
            Significance Threshold:
            <input
              type="number"
              min="0.1"
              max="0.9"
              step="0.1"
              value={settings.threshold}
              onChange={(e) => updateSetting('threshold', Number(e.target.value))}
            />
          </label>
        </div>
        <div className="setting-group">
          <span>Allowed Emotes:</span>
          <div className="emote-toggles">
            {['❤️', '👍', '😢', '😡'].map(emote => (
              <label key={emote}>
                <input
                  type="checkbox"
                  checked={settings.allowedEmotes.includes(emote)}
                  onChange={(e) => {
                    const newEmotes = e.target.checked
                      ? [...settings.allowedEmotes, emote]
                      : settings.allowedEmotes.filter(e => e !== emote)
                    // Ensure at least one emote is selected
                    if (newEmotes.length > 0) {
                      updateSetting('allowed-emotes', newEmotes)
                    }
                  }}
                />
                {emote}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Moments Display */}
      <div className="moments-panel">
        <h2>Significant Moments</h2>
        <ul>
          {moments.map((moment, index) => (
            <li key={index} className="moment-item">
              <span className="moment-emote">{moment.emote}</span>
              <span className="moment-info">
                {moment.percentage}% at {moment.timestamp}
                (Count: {moment.count}/{moment.total})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App
