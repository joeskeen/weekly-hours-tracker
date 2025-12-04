# TimeWidget - Weekly Hours Time Tracker

A Progressive Web App (PWA) for tracking your work hours with weekly targets and progress monitoring. Perfect for freelancers, contractors, and remote workers with flexible schedules who need simple, privacy-first hour tracking.

## 💡 Why TimeWidget?

Managing flexible hours doesn't require complex timekeeping systems. TimeWidget gives you:

- **Simple Weekly Tracking**: See your progress at a glance with visual progress bars. Know exactly how many hours you need to complete your weekly goals.
- **Privacy First**: Your data never leaves your device. No employer surveillance, no analytics tracking—just your hours, your way.
- **Works Everywhere**: Track time offline from anywhere. Perfect for remote work, client sites, or whenever you need to log hours without internet.
- **Flexible Entry**: Add, edit, or adjust time entries anytime. Real work doesn't always fit into neat time slots—this tool adapts to you.
- **Install & Forget**: Works as a standard web app or installed on your device. No subscriptions, no cloud accounts, no complexity.

## ✨ Features

- ⏱️ **Time Tracking**: Clock in/out with precise timestamps
- 📊 **Weekly Progress**: Visual progress bars and remaining hours
- 🎯 **Smart Clock-Out**: Get intelligent recommendations on when to stop working to hit your weekly targets on schedule
- 🎛️ **Fully Customizable**: Set your own weekly hour targets and daily plans—the smart recommendations adapt to your goals
- 📅 **Week Navigation**: Browse past and current weeks
- 📤 **Export Data**: Download time entries as CSV or JSON
- 🌓 **Dark Mode**: Eye-friendly dark theme by default
- 📱 **PWA**: Install as an app, works offline
- 🔒 **Privacy First**: All data stored locally (IndexedDB)

## 🚀 Quick Start

### Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## 📱 PWA Installation

This app is a full Progressive Web App! See [PWA-README.md](./PWA-README.md) for complete details.

### Quick Install

1. **Mobile**: Open in browser → Menu → "Add to Home Screen"
2. **Desktop**: Open in Chrome/Edge → Click install icon in address bar

### Ready to Deploy

All PWA icons are generated and ready. Just build and deploy!

## 🧪 Testing

### Run unit tests

```bash
npm run test
```

### Run tests in CI mode (no watch)

```bash
npm run test:ci
```

### Run with coverage

```bash
npm run test:ci
```

Coverage reports are generated in the `coverage/` directory.

**Current Test Stats**: 228 tests passing ✅

## 🏗️ Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## 📂 Project Structure

```
time-widget/
├── src/
│   ├── app/
│   │   ├── edit-entry/          # Edit time entries
│   │   ├── entry-item/          # Individual entry display
│   │   ├── setup/               # Settings configuration
│   │   ├── time-entries-list/   # List of time entries
│   │   ├── time-input/          # Clock in/out controls
│   │   ├── weekly-progress/     # Progress visualization
│   │   ├── app.ts               # Main component
│   │   ├── storage.service.ts   # IndexedDB storage
│   │   ├── setup.service.ts     # Settings management
│   │   ├── theme.directive.ts   # Theme switching
│   │   └── week-utils.ts        # Date/week calculations
│   ├── index.html               # App entry point
│   └── styles.scss              # Global styles
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service worker
│   ├── generate-icons.html      # Icon generator tool
│   └── ICONS-README.md          # Icon instructions
├── PWA-README.md                # PWA documentation
└── TODO.md                      # Development tasks
```

## 🎨 Customization

### Theme Colors

Edit in `src/styles.scss`:

- Primary color: `--primary-color`
- Background: `--bg-color`
- Text: `--text-color`

### PWA Settings

Edit `public/manifest.json`:

- App name, colors, icons
- Display mode, orientation

## 🛠️ Technologies

- **Angular 21** - Modern web framework
- **TypeScript** - Type-safe development
- **SCSS** - Enhanced styling
- **IndexedDB** - Client-side storage
- **Vitest** - Fast unit testing
- **PWA** - Progressive Web App features

## 📊 Data Storage

All data is stored locally in your browser using IndexedDB:

- **Timesheets**: Time entries organized by week
- **Setup**: User preferences and settings
- **Theme**: Dark/light mode preference

No data is sent to any server. Your privacy is protected.

## 🔒 Security & Privacy

- ✅ No authentication required
- ✅ No server communication
- ✅ All data stored locally
- ✅ Works completely offline
- ✅ No tracking or analytics

## 📝 License

This project is part of the fed-sandbox repository.

## 🤝 Contributing

This is an internal project. See CONTRIBUTING.md for guidelines.

## Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [PWA Documentation](./PWA-README.md)
