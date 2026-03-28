# Take Screenshot

Take a screenshot of the current page. This command captures the current view state of the Lynx application and saves it as an image file.

## Usage

```bash
node scripts/index.mjs take-screenshot [options]
```

## Options

- `-c, --client <clientId>`: Client ID. If not provided, the command will attempt to discover the first available client.
- `-s, --session <sessionId>`: Session ID. If not provided, the command will attempt to discover the latest available session.
- `-o, --output <path>`: The file path where the screenshot will be saved. Defaults to `screenshot-<timestamp>.jpeg` in the current working directory.

## Behavior

The command sends a `Lynx.getScreenshot` CDP command to the connected session and waits for the `Lynx.screenshotCaptured` event which contains the base64 encoded image data.

It waits up to 10 seconds for the screenshot data to be received.

## Output

On success, the command writes the image file to disk and prints the path to the saved file:

```
Screenshot saved to /path/to/screenshot-1234567890.jpeg
```

## Examples

### Take a screenshot and save to default file

```bash
node scripts/index.mjs take-screenshot
```

### Save to a specific file

```bash
node scripts/index.mjs take-screenshot --output my-app.jpeg
```

### Specify client and session

```bash
node scripts/index.mjs take-screenshot -c <client-id> -s <session-id>
```
