# The No BS Policy

A minimalistic website for hosting versioned policies with no bullshit.

## Stack

- **Vite** - Fast development and building
- **Vanilla JavaScript** - No framework overhead
- **Tailwind CSS** - Utility-first styling
- **Markdown** - Simple policy format
- **File-based routing** - Policies stored as `.md` files

## Features

- ✅ Minimal overhead
- ✅ Fast loading
- ✅ Easy to maintain
- ✅ Versioned policies
- ✅ Clean, responsive design
- ✅ No bullshit

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173

## Adding Policies

1. Create a new markdown file in `app/policies/` with semantic versioning:
   ```
   app/policies/0.3.0.md
   ```

2. The main page will automatically show the latest version
3. All versions are available at `/policies`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Structure

```
app/
├── policies/          # Policy markdown files
│   ├── 0.1.0.md
│   └── 0.2.0.md
├── main.js           # Main application logic
├── style.css         # Tailwind CSS
└── index.html        # HTML template
```

## API Endpoints

- `GET /api/policies` - List all policies
- `GET /api/policies/{version}` - Get specific policy

## License

ISC
