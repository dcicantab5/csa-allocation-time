# Circular Statistics Analysis Visualization: Allocation Time

An interactive visualization for displaying and exploring circular statistics from time-based data.

## About

This visualization presents hourly activity data analyzed using circular statistics. Circular statistics is a specialized field of statistics that deals with data points distributed on a circle, such as directions or cyclic time data (hours of the day).

The visualization features:

- An interactive rose chart showing the distribution of activity across 24 hours
- Multiple view modes: hourly breakdown, 4-hour time blocks, and day-by-day analysis
- Mean direction visualization with proper circular calculations
- Interactive tooltips and detailed information panels
- Color scheme customization options

## Technical Details

- Built with React (loaded via CDN)
- Uses Tailwind CSS for styling (loaded via CDN)
- No build step required - works directly in the browser
- SVG-based visualization for crisp rendering at any scale

## Circular Statistics

The visualization displays several key circular statistics:

- **Mean Direction** - The average time of activity (7:56pm overall)
- **Concentration (R)** - How concentrated the data is around the mean (0-1 scale)
- **Circular Variance** - Measure of spread in circular data
- **Rayleigh Test** - Tests if the distribution is significantly different from uniform

## Data Source

The visualization is based on hourly activity data from March 2025, analyzed using circular statistical methods.

## License

AGPL3.0 License
