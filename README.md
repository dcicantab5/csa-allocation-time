# Circular Statistics Analysis Visualisation: Allocation Time

An interactive visualisation for displaying and exploring circular statistics from time-based data.

## About

This visualisation presents hourly activity data analysed using circular statistics. Circular statistics is a specialised field of statistics that deals with data points distributed on a circle, such as directions or cyclic time data (hours of the day).

The visualisation features:

- An interactive rose chart showing the distribution of activity across 24 hours
- Multiple view modes: hourly breakdown, 4-hour time blocks, and day-by-day analysis
- Mean direction visualisation with proper circular calculations
- Interactive tooltips and detailed information panels
- Color scheme customisation options

## Technical Details

- Built with React (loaded via CDN)
- Uses Tailwind CSS for styling (loaded via CDN)
- No build step required - works directly in the browser
- SVG-based visualisation for crisp rendering at any scale

## Circular Statistics

The visualisation displays several key circular statistics:

- **Mean Direction** - The average time of activity (7:56pm overall)
- **Concentration (R)** - How concentrated the data is around the mean (0-1 scale)
- **Circular Variance** - Measure of spread in circular data
- **Rayleigh Test** - Tests if the distribution is significantly different from uniform

## Data Source

The visualisation is based on hourly activity data from March 2025, analysed using circular statistical methods.

## License

AGPL3.0 License
