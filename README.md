# 🏈 Retro Gridiron

A retro pixel-art football game built with vanilla JavaScript and HTML5 Canvas. Play as the quarterback and lead your team to victory!

## 🎮 Play Now

**Play directly in your browser:**
- Download or clone this repository
- Open `index.html` in your web browser
- Press START GAME to begin!

## 🕹️ How to Play

### Objective
Score touchdowns by moving the football down the field. Each touchdown is worth 7 points. Play against the CPU through 4 quarters.

### Controls

**Desktop (Keyboard):**
- `Arrow Keys` or `WASD` - Move the quarterback
- `Shift` - Sprint (faster movement)
- `Space` - SNAP to start a play
- `P` - Throw a PASS to a receiver
- `R` - Run the ball forward

**Mobile:**
- Use the directional pad buttons on screen
- Tap SPRINT for extra speed
- Tap SNAP, PASS, and RUN buttons

### Game Mechanics

**Plays:**
- **RUN** - Quick forward rush for 3-5 yards
- **PASS** - Throw to the closest receiver (higher success with shorter distances)
- **SNAP** - Start the play and control the quarterback manually

**Down System:**
- You have 4 downs to advance 10 yards
- Advance 10+ yards = get a new set of 4 downs
- Fail to advance after 4 downs = turnover to CPU

**Scoring:**
- Reach the opponent's end zone = TOUCHDOWN (7 points)
- Cross the end line = Automatic touchdown

**Defense:**
- 7 AI defenders try to tackle you
- Avoid defenders or get tackled for a loss of down
- Receivers can also be defended

## 🎯 Features

✅ **4 Quarter Game** - Full football game with realistic quarter system
✅ **AI Opponent** - CPU team scores and plays defense
✅ **Multiple Play Options** - Pass, run, or manual control
✅ **Receiver Routes** - Three receivers with different routes
✅ **Pixel Art Graphics** - Retro 8-bit style characters and field
✅ **Dynamic Stats** - Live scoreboard, clock, down counter
✅ **Celebration Effects** - Confetti animation on touchdowns
✅ **Responsive Design** - Works on desktop and mobile
✅ **Real-Time Gameplay** - Smooth 60 FPS animation

## 📁 Project Structure

```
retro-gridiron/
├── index.html      # Main HTML file
├── style.css       # Styling and layout
├── game.js         # Game logic and engine
└── README.md       # This file
```

## 🛠️ Technologies Used

- **HTML5** - Page structure
- **CSS3** - Styling and responsive design
- **JavaScript (Vanilla)** - Game logic and canvas rendering
- **HTML5 Canvas API** - 2D graphics rendering

## 📊 Game Stats

- **Player Size:** 24x30 pixels
- **Receiver Size:** 22x29 pixels
- **Defender Size:** 25x31 pixels
- **Field Width:** 960 pixels
- **Field Height:** 540 pixels
- **Game Speed:** 60 FPS
- **Game Duration:** 2 minutes per quarter (8 minutes total)

## 🎨 Color Scheme

- **Field:** #238b46 (Green)
- **Player (Home):** #ffd447 (Yellow)
- **Receivers (Away):** #58a6ff (Blue)
- **Defenders:** #e74b4b (Red)
- **End Zones:** Blue (Home) / Red (Away)
- **UI Background:** #15191c (Dark)

## 💡 Tips for Winning

1. **Mix Up Your Plays** - Don't always pass or run. Keep the CPU guessing!
2. **Move in the Pocket** - Use arrow keys to dodge defenders while holding the ball
3. **Short Passes** - Shorter pass attempts have better completion rates
4. **Sprint Strategically** - Use Shift to sprint when near the end zone
5. **Read Receiver Routes** - Each receiver takes a different path
6. **Manage the Clock** - You only have 2 minutes per quarter!

## 🐛 Known Issues

- None at this time! Report bugs on the Issues page.

## 🚀 Future Enhancements

- [ ] Field goal attempts (3 points)
- [ ] Extra point (kick after touchdown)
- [ ] Fumble mechanics
- [ ] Interceptions
- [ ] Replay system
- [ ] Difficulty levels
- [ ] Sound effects and music
- [ ] Leaderboard/high scores
- [ ] Two-player mode
- [ ] Different stadium themes

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Created by [owenj4231o](https://github.com/owenj4231o-lgtm)

---

**Enjoy the game! 🏈 Go score some touchdowns!**