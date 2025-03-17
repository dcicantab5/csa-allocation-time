import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const App = () => {
  const [circularStatsData, setCircularStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from the JSON file
    fetch('./data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setCircularStatsData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Loading circular statistics data...</div>;
  }

  if (error) {
    return <div className="error">Error loading data: {error}</div>;
  }

  if (!circularStatsData) {
    return <div className="error">No data available</div>;
  }

  // Now we can render the InteractiveRoseChart component with the loaded data
  return <InteractiveRoseChart data={circularStatsData} />;
};

const InteractiveRoseChart = ({ data }) => {
  // State variables
  const [viewMode, setViewMode] = useState('overall'); // 'overall', 'daily', 'timeBlocks'
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [chartColorScheme, setChartColorScheme] = useState('blues'); // 'blues', 'purples', 'greens', 'oranges'

  // Chart dimensions
  const width = 650;
  const height = 650;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 80; // Leave space for labels and legend

  // Handle segment click
  const handleSegmentClick = (index) => {
    setSelectedSegment(selectedSegment === index ? null : index);
  };

  // Handle day selection
  const handleDayChange = (e) => {
    setSelectedDay(e.target.value);
    setSelectedSegment(null);
  };

  // Toggle view mode
  const toggleViewMode = (mode) => {
    setViewMode(mode);
    setSelectedSegment(null);
  };

  // Toggle label visibility
  const toggleLabels = () => {
    setShowLabels(!showLabels);
  };

  // Change color scheme
  const changeColorScheme = (scheme) => {
    setChartColorScheme(scheme);
  };

  // Helper function to get base color based on selected scheme
  const getBaseColor = (intensity) => {
    switch (chartColorScheme) {
      case 'purples':
        return `rgb(${255-intensity}, ${255-intensity*0.6}, 255)`;
      case 'greens':
        return `rgb(${255-intensity*0.7}, 255, ${255-intensity*0.7})`;
      case 'oranges':
        return `rgb(255, ${255-intensity*0.6}, ${255-intensity*0.8})`;
      default: // blues
        return `rgb(${255-intensity}, ${255-intensity}, 255)`;
    }
  };

  // Get selected highlights color
  const getHighlightColor = () => {
    switch (chartColorScheme) {
      case 'purples':
        return '#9c27b0';
      case 'greens':
        return '#4caf50';
      case 'oranges':
        return '#ff5722';
      default: // blues
        return '#2196f3';
    }
  };

  // Format time from hour (0-23)
  const formatHour = (hour) => {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'am' : 'pm';
    return `${h}${ampm}`;
  };

  // Generate time label for an hour
  const generateTimeLabel = (hour) => {
    return `${formatHour(hour)}-${formatHour((hour + 1) % 24)}`;
  };

  // Helper to extract hour from time slot string
  const getHourFromTimeSlot = (timeSlot) => {
    const parts = timeSlot.split('-');
    return getHourFromTimeString(parts[0]);
  };

  // Helper to extract hour from time string (e.g. "8am", "12pm")
  const getHourFromTimeString = (timeString) => {
    const isPM = timeString.toLowerCase().includes('pm');
    const isAM = timeString.toLowerCase().includes('am');
    
    let hour = parseInt(timeString.replace(/[^0-9]/g, ''));
    
    if (isPM && hour !== 12) {
      hour += 12;
    } else if (isAM && hour === 12) {
      hour = 0;
    }
    
    return hour;
  };

  // Parse time string like "7:56pm" to angle in radians
  const parseTimeToRadians = (timeString) => {
    // Extract hour, minute, and am/pm
    const match = timeString.match(/(\d+):(\d+)([ap]m)/i);
    if (!match) return 0;
    
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const isPM = match[3].toLowerCase() === 'pm';
    
    // Convert to 24-hour format
    if (isPM && hour !== 12) hour += 12;
    else if (!isPM && hour === 12) hour = 0;
    
    // Convert to decimal hours
    const decimalHour = hour + (minute / 60);
    
    // Convert to radians
    return (decimalHour / 24) * 2 * Math.PI;
  };

  // Get current data based on selected view and day
  const getCurrentData = () => {
    if (viewMode === 'overall') {
      return data.hourlyDistribution.map(item => ({
        hour: getHourFromTimeSlot(item.timeSlot),
        timeSlot: item.timeSlot,
        count: item.count
      }));
    } else if (viewMode === 'timeBlocks') {
      // Convert time blocks to segments at the middle of each block
      return data.timeBlocks.map(block => {
        const hourRange = block.timeBlock.split('-');
        const startHour = getHourFromTimeString(hourRange[0]);
        const endHour = getHourFromTimeString(hourRange[1]);
        const midpointHour = (startHour + (endHour - startHour) / 2) % 24;
        
        return {
          hour: midpointHour,
          timeSlot: block.timeBlock,
          count: block.count,
          percentage: block.percentage
        };
      });
    } else if (viewMode === 'daily') {
      if (selectedDay === 'all') {
        return data.hourlyDistribution.map(item => ({
          hour: getHourFromTimeSlot(item.timeSlot),
          timeSlot: item.timeSlot,
          count: item.count
        }));
      } else {
        const dayIndex = parseInt(selectedDay.replace('day', ''));
        const dayData = data.dayStats[dayIndex];
        
        return dayData.hourlyBreakdown.map(item => ({
          hour: getHourFromTimeSlot(item.timeSlot),
          timeSlot: item.timeSlot,
          count: item.count
        }));
      }
    }
    
    return [];
  };

  // Get circular statistics for the current view
  const getCurrentStats = () => {
    if (viewMode === 'daily' && selectedDay !== 'all') {
      const dayIndex = parseInt(selectedDay.replace('day', ''));
      const dayData = data.dayStats[dayIndex];
      
      return {
        meanTime: dayData.meanTime,
        concentration: dayData.concentration,
        variance: dayData.variance,
        total: dayData.total
      };
    }
    
    return {
      meanTime: data.summary.meanDirection.time,
      concentration: data.summary.concentration.meanResultantLength,
      variance: data.summary.variance.circularVariance,
      total: data.metadata.totalObservations
    };
  };

  // Get current dataset based on view settings
  const currentData = getCurrentData();
  const currentStats = getCurrentStats();
  
  // Find max count for scaling
  const maxCount = Math.max(...currentData.map(d => d.count));
  
  // Calculate wedge angle based on view mode
  const wedgeAngle = viewMode === 'timeBlocks' ? (2 * Math.PI) / 6 : (2 * Math.PI) / 24;
  
  // Generate segments for the rose chart
  const segments = currentData.map((item, i) => {
    const startAngle = (item.hour / 24) * 2 * Math.PI - wedgeAngle / 2;
    const endAngle = startAngle + wedgeAngle;
    
    // Scale the radius based on count
    const segmentRadius = (item.count / maxCount) * radius * 0.9;
    
    // Calculate path coordinates
    const startX = centerX + Math.sin(startAngle) * segmentRadius;
    const startY = centerY - Math.cos(startAngle) * segmentRadius;
    const endX = centerX + Math.sin(endAngle) * segmentRadius;
    const endY = centerY - Math.cos(endAngle) * segmentRadius;
    
    // Create SVG arc path
    const largeArcFlag = 0;
    const path = [
      `M ${centerX} ${centerY}`,
      `L ${startX} ${startY}`,
      `A ${segmentRadius} ${segmentRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      'Z'
    ].join(' ');
    
    // Calculate base color intensity
    const intensity = Math.max(30, Math.min(220, Math.floor(50 + (item.count / maxCount) * 180)));
    
    // Adjust colors based on selection/hover state
    let fillColor = getBaseColor(intensity);
    
    // If this segment is selected or hovered, adjust color
    if (selectedSegment === i) {
      fillColor = getHighlightColor();
    } else if (hoveredSegment === i) {
      fillColor = getBaseColor(intensity + 40);
    }
    
    // Calculate position for hour label
    const labelAngle = startAngle + wedgeAngle / 2;
    const labelRadius = radius + 25;
    const labelX = centerX + Math.sin(labelAngle) * labelRadius;
    const labelY = centerY - Math.cos(labelAngle) * labelRadius;
    
    // Calculate text anchor and rotation for label
    let textAnchor = "middle";
    let labelRotation = (labelAngle * 180 / Math.PI) + 90;
    if (labelRotation > 90 && labelRotation < 270) {
      labelRotation += 180;
    }
    
    return {
      path,
      fillColor,
      hour: item.hour,
      timeSlot: item.timeSlot,
      count: item.count,
      percentage: item.percentage,
      labelX,
      labelY,
      labelAngle,
      labelRotation,
      textAnchor,
      startAngle,
      endAngle,
      segmentRadius
    };
  });

  // Generate hour markers
  const hourMarkers = [];
  const hourStep = viewMode === 'timeBlocks' ? 4 : 1;
  for (let i = 0; i < 24; i += hourStep) {
    const angle = (i / 24) * 2 * Math.PI;
    const markerRadius = radius + 10;
    const x = centerX + Math.sin(angle) * markerRadius;
    const y = centerY - Math.cos(angle) * markerRadius;
    
    let displayHour = i % 12 || 12;
    const ampm = i < 12 ? 'am' : 'pm';
    const label = `${displayHour}${ampm}`;
    
    hourMarkers.push({
      x,
      y,
      hour: i,
      label,
      active: currentData.some(d => Math.abs(d.hour - i) < hourStep/2)
    });
  }

  // Prepare selected segment details
  let selectedSegmentDetails = null;
  if (selectedSegment !== null && segments[selectedSegment]) {
    const segment = segments[selectedSegment];
    selectedSegmentDetails = (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-bold text-lg text-blue-800">{segment.timeSlot} Details</h3>
        <p className="font-medium">Total occurrences: {segment.count}</p>
        <p>This represents {((segment.count / currentStats.total) * 100).toFixed(1)}% of all activity</p>
        
        {viewMode === 'overall' && (
          <div className="mt-2">
            <p className="font-medium">Daily breakdown:</p>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {data.dayStats.map((day, idx) => {
                const hourData = day.hourlyBreakdown.find(h => 
                  getHourFromTimeSlot(h.timeSlot) === segment.hour
                ) || { count: 0 };
                return (
                  <div key={idx} className={`p-2 rounded shadow-sm ${hourData.count > 0 ? 'bg-white' : 'bg-gray-100'}`}>
                    <p className="font-medium">{day.day}</p>
                    <p>{hourData.count} occurrences</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Create value axis labels
  const valueAxisLabels = [];
  for (let i = 1; i <= 4; i++) {
    const value = Math.ceil(maxCount * (i / 4));
    valueAxisLabels.push({
      value,
      radius: radius * (i / 4)
    });
  }

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2">Interactive Hourly Activity Rose Chart</h2>
      <p className="text-gray-600 mb-4">Data from {data.metadata.analysisDate} circular statistics analysis</p>
      
      {/* Controls */}
      <div className="flex flex-wrap justify-center items-center gap-3 mb-4">
        <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
          <span className="font-medium mr-2">View:</span>
          <button 
            onClick={() => toggleViewMode('overall')} 
            className={`px-3 py-1 rounded-md mr-1 ${viewMode === 'overall' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Hourly
          </button>
          <button 
            onClick={() => toggleViewMode('timeBlocks')} 
            className={`px-3 py-1 rounded-md mr-1 ${viewMode === 'timeBlocks' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Time Blocks
          </button>
          <button 
            onClick={() => toggleViewMode('daily')} 
            className={`px-3 py-1 rounded-md ${viewMode === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            By Day
          </button>
        </div>
        
        {viewMode === 'daily' && (
          <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
            <label className="font-medium mr-2">Day:</label>
            <select 
              value={selectedDay}
              onChange={handleDayChange}
              className="px-2 py-1 border rounded"
            >
              <option value="all">All Days</option>
              {data.dayStats.map((day, idx) => (
                <option key={idx} value={`day${idx}`}>{day.day}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
          <label className="font-medium mr-2">Color:</label>
          <select 
            value={chartColorScheme}
            onChange={(e) => changeColorScheme(e.target.value)}
            className="px-2 py-1 border rounded"
          >
            <option value="blues">Blues</option>
            <option value="purples">Purples</option>
            <option value="greens">Greens</option>
            <option value="oranges">Oranges</option>
          </select>
        </div>
        
        <button 
          onClick={toggleLabels}
          className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100"
        >
          {showLabels ? 'Hide Labels' : 'Show Labels'}
        </button>
      </div>
      
      {/* Chart container */}
      <div className="relative">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Title */}
          <text
            x={centerX}
            y={20}
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            fill="#444"
          >
            {viewMode === 'overall' ? 'Overall Activity by Hour' : 
             viewMode === 'timeBlocks' ? 'Activity by 4-Hour Blocks' :
             `Activity by Hour ${selectedDay !== 'all' ? `(${data.dayStats[parseInt(selectedDay.replace('day', ''))].day})` : '(All Days)'}`}
          </text>
          
          {/* Add circular grid lines with value labels */}
          {valueAxisLabels.map((axisLabel, i) => (
            <g key={i}>
              <circle
                cx={centerX}
                cy={centerY}
                r={axisLabel.radius}
                fill="none"
                stroke="#ddd"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              {showLabels && (
                <text
                  x={centerX + 5}
                  y={centerY - axisLabel.radius - 5}
                  fontSize="9"
                  fill="#777"
                >
                  {axisLabel.value}
                </text>
              )}
            </g>
          ))}
          
          {/* Add mean direction indicator */}
          {viewMode !== 'timeBlocks' && (
            <g>
              <line
                x1={centerX}
                y1={centerY}
                x2={centerX + Math.sin(parseTimeToRadians(currentStats.meanTime)) * radius}
                y2={centerY - Math.cos(parseTimeToRadians(currentStats.meanTime)) * radius}
                stroke="#ff4081"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <circle
                cx={centerX + Math.sin(parseTimeToRadians(currentStats.meanTime)) * radius}
                cy={centerY - Math.cos(parseTimeToRadians(currentStats.meanTime)) * radius}
                r="4"
                fill="#ff4081"
              />
              <text
                x={centerX + Math.sin(parseTimeToRadians(currentStats.meanTime)) * (radius + 15)}
                y={centerY - Math.cos(parseTimeToRadians(currentStats.meanTime)) * (radius + 15)}
                fontSize="10"
                fill="#ff4081"
                fontWeight="bold"
                textAnchor="middle"
              >
                {currentStats.meanTime}
              </text>
            </g>
          )}
          
          {/* Draw rose chart segments with interactivity */}
          {segments.map((segment, i) => (
            <g key={i}>
              <path
                d={segment.path}
                fill={segment.fillColor}
                stroke={selectedSegment === i ? "#ff6b6b" : "#667eea"}
                strokeWidth={selectedSegment === i ? "2" : "1"}
                opacity={selectedSegment !== null && selectedSegment !== i ? "0.6" : "0.95"}
                onMouseEnter={() => setHoveredSegment(i)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => handleSegmentClick(i)}
                style={{ cursor: 'pointer', transition: 'fill 0.3s, opacity 0.3s, stroke 0.3s' }}
              />
              
              {/* Add hover effect */}
              {hoveredSegment === i && (
                <path
                  d={segment.path}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animate 
                    attributeName="strokeWidth" 
                    values="2;3;2" 
                    dur="1s" 
                    repeatCount="indefinite" 
                  />
                </path>
              )}
            </g>
          ))}
          
          {/* Add center point */}
          <circle cx={centerX} cy={centerY} r={4} fill="#667eea" />
          
          {/* Add hour labels */}
          {showLabels && hourMarkers.map((marker, i) => (
            <text
              key={i}
              x={marker.x}
              y={marker.y}
              fontSize="10"
              fontWeight={marker.active ? "bold" : "normal"}
              textAnchor="middle"
              alignmentBaseline="middle"
              fill={marker.active ? "#555" : "#999"}
            >
              {marker.label}
            </text>
          ))}
          
          {/* Add count values inside segments */}
          {segments.map((segment, i) => {
            const valueAngle = (segment.hour / 24) * 2 * Math.PI;
            const valueRadius = (segment.count / maxCount) * radius * 0.5;
            const valueX = centerX + Math.sin(valueAngle) * valueRadius;
            const valueY = centerY - Math.cos(valueAngle) * valueRadius;
            
            // Only show values for significant segments, selected segments, or time blocks
            return ((segment.count > maxCount * 0.2) || selectedSegment === i || viewMode === 'timeBlocks') ? (
              <text
                key={i}
                x={valueX}
                y={valueY}
                fontSize={selectedSegment === i ? "12" : "10"}
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="#fff"
              >
                {segment.count}
                {viewMode === 'timeBlocks' && segment.percentage ? 
                  <tspan x={valueX} y={valueY + 14} fontSize="9">({segment.percentage}%)</tspan> : null}
              </text>
            ) : null;
          })}
          
          {/* Tooltip for hovered segment */}
          {hoveredSegment !== null && (
            <g transform={`translate(${centerX + 20}, ${centerY - 100})`}>
              <rect x="-80" y="-20" width="160" height="60" rx="5" ry="5" fill="white" fillOpacity="0.9" stroke="#ccc" />
              <text x="0" y="0" textAnchor="middle" fontWeight="bold">{segments[hoveredSegment].timeSlot}</text>
              <text x="0" y="20" textAnchor="middle">{segments[hoveredSegment].count} occurrences</text>
              <text x="0" y="35" textAnchor="middle" fontSize="10" fill="#666">Click for details</text>
            </g>
          )}
          
          {/* Legend */}
          <g transform={`translate(${width - 110}, ${height - 140})`}>
            <rect x="0" y="0" width="100" height="130" fill="white" fillOpacity="0.9" rx="4" stroke="#ddd" />
            <text x="10" y="20" fontSize="12" fontWeight="bold">Legend</text>
            
            <circle cx="15" cy="40" r="5" fill="#667eea" />
            <text x="25" y="43" fontSize="10">Data point</text>
            
            <line x1="10" y1="60" x2="20" y2="60" stroke="#ff4081" strokeWidth="2" strokeDasharray="5,5" />
            <circle cx="20" cy="60" r="3" fill="#ff4081" />
            <text x="25" y="63" fontSize="10">Mean direction</text>
            
            <rect x="10" y="75" width="10" height="10" fill={getHighlightColor()} />
            <text x="25" y="83" fontSize="10">Selected hour</text>
            
            <path d="M10,100 L20,100" stroke="#ddd" strokeWidth="1" strokeDasharray="2,2" />
            <text x="25" y="103" fontSize="10">Count levels</text>
            
            <text x="10" y="120" fontSize="9" fill="#666">R={currentStats.concentration.toFixed(2)}</text>
          </g>
        </svg>
      </div>
      
      {/* Selected segment details */}
      {selectedSegmentDetails}
      
      {/* Statistics section */}
      <div className="mt-6 w-full max-w-2xl bg-gray-50 p-4 rounded-lg shadow-sm text-sm">
        <h3 className="font-semibold text-lg mb-2">Statistics for {viewMode === 'daily' && selectedDay !== 'all' ? 
          `Day ${data.dayStats[parseInt(selectedDay.replace('day', ''))].day}` : 'All Data'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><span className="font-medium">Mean Time:</span> {currentStats.meanTime}</p>
            <p><span className="font-medium">Concentration (R):</span> {currentStats.concentration.toFixed(3)}</p>
            <p><span className="font-medium">Circular Variance:</span> {currentStats.variance.toFixed(3)}</p>
            <p><span className="font-medium">Total Occurrences:</span> {currentStats.total}</p>
          </div>
          <div>
            <p><span className="font-medium">Peak Activity:</span> {data.peakActivity.hourlyPeaks[0].timeSlot} ({data.peakActivity.hourlyPeaks[0].count} occurrences)</p>
            <p><span className="font-medium">Peak Block:</span> {data.peakActivity.blockPeak} ({data.timeBlocks.find(b => b.timeBlock.includes(data.peakActivity.blockPeak.split('-')[0]))?.count || ''} occurrences)</p>
            <p><span className="font-medium">Uniformity Test:</span> {data.uniformityTests.rayleigh.pValue < 0.05 ? "Non-uniform distribution (p < 0.05)" : "Uniform distribution"}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-600">
          Interaction guide: Hover over segments to see details, click to select an hour for more information.
          Toggle between view modes to explore different perspectives of the data.
        </p>
      </div>
    </div>
  );
};

// Wait for DOM to be loaded before rendering
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  ReactDOM.render(<App />, root);
});

// Export the App component for potential module usage
export default App;
