// Main application script for the Circular Statistics Visualisation
// Uses React for rendering and expects circularStatsData to be defined globally

// Create a React component for the circular statistics rose chart
const CircularStatsRoseChart = () => {
  // State for interactive features
  const [viewMode, setViewMode] = React.useState('overall'); // 'overall', 'daily', 'timeBlocks'
  const [selectedDay, setSelectedDay] = React.useState('all');
  const [selectedSegment, setSelectedSegment] = React.useState(null);
  const [hoveredSegment, setHoveredSegment] = React.useState(null);
  const [showLabels, setShowLabels] = React.useState(true);
  const [chartColorScheme, setChartColorScheme] = React.useState('blues'); // 'blues', 'purples', 'greens', 'oranges'

  // Chart dimensions
  const width = 650;
  const height = 650;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 80; // Leave space for labels and legend

  // Event handlers
  const handleSegmentClick = (index) => {
    setSelectedSegment(selectedSegment === index ? null : index);
  };

  const handleDayChange = (e) => {
    setSelectedDay(e.target.value);
    setSelectedSegment(null);
  };

  const toggleViewMode = (mode) => {
    setViewMode(mode);
    setSelectedSegment(null);
  };

  const toggleLabels = () => {
    setShowLabels(!showLabels);
  };

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
      return circularStatsData.hourlyDistribution.map(item => ({
        hour: getHourFromTimeSlot(item.timeSlot),
        timeSlot: item.timeSlot,
        count: item.count
      }));
    } else if (viewMode === 'timeBlocks') {
      // Convert time blocks to segments at the middle of each block
      return circularStatsData.timeBlocks.map(block => {
        const hourRange = block.timeBlock.split('-');
        const startHour = getHourFromTimeString(hourRange[0]);
        let endHour = getHourFromTimeString(hourRange[1]);
        
        // Handle blocks that cross midnight
        if (endHour < startHour) {
          endHour += 24;
        }
        
        const midpointHour = (startHour + (endHour - startHour) / 2) % 24;
        
        return {
          hour: midpointHour,
          timeSlot: block.timeBlock,
          count: block.count,
          percentage: block.percentage,
          startHour,
          endHour: endHour % 24
        };
      });
    } else if (viewMode === 'daily') {
      if (selectedDay === 'all') {
        return circularStatsData.hourlyDistribution.map(item => ({
          hour: getHourFromTimeSlot(item.timeSlot),
          timeSlot: item.timeSlot,
          count: item.count
        }));
      } else {
        const dayIndex = parseInt(selectedDay.replace('day', ''));
        const dayData = circularStatsData.dayStats[dayIndex];
        
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
      const dayData = circularStatsData.dayStats[dayIndex];
      
      return {
        meanTime: dayData.meanTime,
        concentration: dayData.concentration,
        variance: dayData.variance,
        total: dayData.total
      };
    }
    
    return {
      meanTime: circularStatsData.summary.meanDirection.time,
      concentration: circularStatsData.summary.concentration.meanResultantLength,
      variance: circularStatsData.summary.variance.circularVariance,
      total: circularStatsData.metadata.totalObservations
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
      startHour: item.startHour,
      endHour: item.endHour,
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
  
  // Create value axis labels
  const valueAxisLabels = [];
  for (let i = 1; i <= 4; i++) {
    const value = Math.ceil(maxCount * (i / 4));
    valueAxisLabels.push({
      value,
      radius: radius * (i / 4)
    });
  }

  return React.createElement(
    'div',
    { className: 'flex flex-col items-center' },
    // Title
    React.createElement('h2', { className: 'text-2xl font-bold mb-2' }, 'Hourly Activity Rose Chart'),
    React.createElement('p', { className: 'text-gray-600 mb-4' }, 'Circular Statistics Analysis from March 2025'),
    React.createElement('p', { className: 'text-gray-600 mb-6' }, 'This visualisation presents hourly allocation data analysed using circular statistics'),
    React.createElement('p', { className: 'text-gray-600 mb-6' }, 'Circular statistics is a specialised field of statistics that deals with data points distributed on a circle, such as directions or cyclic time data (hours of the day)'),
    
    // Controls
    React.createElement(
      'div', 
      { className: 'flex flex-wrap justify-center items-center gap-3 mb-4' },
      // View mode controls
      React.createElement(
        'div',
        { className: 'p-2 bg-gray-50 rounded-lg border border-gray-200' },
        React.createElement('span', { className: 'font-medium mr-2' }, 'View:'),
        React.createElement(
          'button',
          { 
            onClick: () => toggleViewMode('overall'),
            className: `px-3 py-1 rounded-md mr-1 ${viewMode === 'overall' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`
          },
          'Hourly'
        ),
        React.createElement(
          'button',
          { 
            onClick: () => toggleViewMode('timeBlocks'),
            className: `px-3 py-1 rounded-md mr-1 ${viewMode === 'timeBlocks' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`
          },
          'Time Blocks'
        ),
        React.createElement(
          'button',
          { 
            onClick: () => toggleViewMode('daily'),
            className: `px-3 py-1 rounded-md ${viewMode === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`
          },
          'By Day'
        )
      ),
      
      // Day selection dropdown (only shown in daily view)
      viewMode === 'daily' && React.createElement(
        'div',
        { className: 'p-2 bg-gray-50 rounded-lg border border-gray-200' },
        React.createElement('label', { className: 'font-medium mr-2' }, 'Day:'),
        React.createElement(
          'select',
          { 
            value: selectedDay,
            onChange: handleDayChange,
            className: 'px-2 py-1 border rounded'
          },
          React.createElement('option', { value: 'all' }, 'All Days'),
          circularStatsData.dayStats.map((day, idx) => 
            React.createElement('option', { key: idx, value: `day${idx}` }, day.day)
          )
        )
      ),
      
      // Color scheme dropdown
      React.createElement(
        'div',
        { className: 'p-2 bg-gray-50 rounded-lg border border-gray-200' },
        React.createElement('label', { className: 'font-medium mr-2' }, 'Color:'),
        React.createElement(
          'select',
          { 
            value: chartColorScheme,
            onChange: (e) => changeColorScheme(e.target.value),
            className: 'px-2 py-1 border rounded'
          },
          React.createElement('option', { value: 'blues' }, 'Blues'),
          React.createElement('option', { value: 'purples' }, 'Purples'),
          React.createElement('option', { value: 'greens' }, 'Greens'),
          React.createElement('option', { value: 'oranges' }, 'Oranges')
        )
      ),
      
      // Toggle labels button
      React.createElement(
        'button',
        { 
          onClick: toggleLabels,
          className: 'p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100'
        },
        showLabels ? 'Hide Labels' : 'Show Labels'
      )
    ),
    
    // SVG Chart container
    React.createElement(
      'div',
      { className: 'relative' },
      React.createElement(
        'svg',
        { width, height, viewBox: `0 0 ${width} ${height}` },
        // Chart title
        React.createElement(
          'text',
          {
            x: centerX,
            y: 20,
            fontSize: '14',
            fontWeight: 'bold',
            textAnchor: 'middle',
            fill: '#444'
          },
          viewMode === 'overall' ? 'Overall Activity by Hour' : 
          viewMode === 'timeBlocks' ? 'Activity by 4-Hour Blocks' :
          `Activity by Hour ${selectedDay !== 'all' ? `(${circularStatsData.dayStats[parseInt(selectedDay.replace('day', ''))].day})` : '(All Days)'}`
        ),
        
        // Circular grid lines with value labels
        valueAxisLabels.map((axisLabel, i) => 
          React.createElement(
            'g',
            { key: i },
            React.createElement('circle', {
              cx: centerX,
              cy: centerY,
              r: axisLabel.radius,
              fill: 'none',
              stroke: '#ddd',
              strokeWidth: '1',
              strokeDasharray: '4,4'
            }),
            showLabels && React.createElement('text', {
              x: centerX + 5,
              y: centerY - axisLabel.radius - 5,
              fontSize: '9',
              fill: '#777'
            }, axisLabel.value)
          )
        ),
        
        // Mean direction indicator
        viewMode !== 'timeBlocks' && React.createElement(
          'g',
          null,
          React.createElement('line', {
            x1: centerX,
            y1: centerY,
            x2: centerX + Math.sin(parseTimeToRadians(currentStats.meanTime)) * radius,
            y2: centerY - Math.cos(parseTimeToRadians(currentStats.meanTime)) * radius,
            stroke: '#ff4081',
            strokeWidth: '2',
            strokeDasharray: '5,5'
          }),
          React.createElement('circle', {
            cx: centerX + Math.sin(parseTimeToRadians(currentStats.meanTime)) * radius,
            cy: centerY - Math.cos(parseTimeToRadians(currentStats.meanTime)) * radius,
            r: '4',
            fill: '#ff4081'
          }),
          React.createElement('text', {
            x: centerX + Math.sin(parseTimeToRadians(currentStats.meanTime)) * (radius + 15),
            y: centerY - Math.cos(parseTimeToRadians(currentStats.meanTime)) * (radius + 15),
            fontSize: '10',
            fill: '#ff4081',
            fontWeight: 'bold',
            textAnchor: 'middle'
          }, currentStats.meanTime)
        ),
        
        // Rose chart segments
        segments.map((segment, i) => 
          React.createElement(
            'g',
            { key: i },
            React.createElement('path', {
              d: segment.path,
              fill: segment.fillColor,
              stroke: selectedSegment === i ? '#ff6b6b' : '#667eea',
              strokeWidth: selectedSegment === i ? '2' : '1',
              opacity: selectedSegment !== null && selectedSegment !== i ? '0.6' : '0.95',
              onMouseEnter: () => setHoveredSegment(i),
              onMouseLeave: () => setHoveredSegment(null),
              onClick: () => handleSegmentClick(i),
              style: { cursor: 'pointer', transition: 'fill 0.3s, opacity 0.3s, stroke 0.3s' }
            }),
            
            // Hover effect
            hoveredSegment === i && React.createElement('path', {
              d: segment.path,
              fill: 'none',
              stroke: '#fff',
              strokeWidth: '2',
              opacity: '0.6'
            }, 
              React.createElement('animate', {
                attributeName: 'strokeWidth',
                values: '2;3;2',
                dur: '1s',
                repeatCount: 'indefinite'
              })
            )
          )
        ),
        
        // Center point
        React.createElement('circle', {
          cx: centerX,
          cy: centerY,
          r: 4,
          fill: '#667eea'
        }),
        
        // Hour labels
        showLabels && hourMarkers.map((marker, i) => 
          React.createElement('text', {
            key: i,
            x: marker.x,
            y: marker.y,
            fontSize: '10',
            fontWeight: marker.active ? 'bold' : 'normal',
            textAnchor: 'middle',
            alignmentBaseline: 'middle',
            fill: marker.active ? '#555' : '#999'
          }, marker.label)
        ),
        
        // Count values inside segments
        segments.map((segment, i) => {
          const valueAngle = (segment.hour / 24) * 2 * Math.PI;
          const valueRadius = (segment.count / maxCount) * radius * 0.5;
          const valueX = centerX + Math.sin(valueAngle) * valueRadius;
          const valueY = centerY - Math.cos(valueAngle) * valueRadius;
          
          // Only show values for significant segments, selected segments, or time blocks
          return ((segment.count > maxCount * 0.2) || selectedSegment === i || viewMode === 'timeBlocks') ? 
            React.createElement(
              'text',
              {
                key: i,
                x: valueX,
                y: valueY,
                fontSize: selectedSegment === i ? '12' : '10',
                fontWeight: 'bold',
                textAnchor: 'middle',
                alignmentBaseline: 'middle',
                fill: '#fff'
              },
              segment.count,
              viewMode === 'timeBlocks' && segment.percentage ? 
                React.createElement('tspan', { x: valueX, y: valueY + 14, fontSize: '9' }, `(${segment.percentage}%)`) : 
                null
            ) : null;
        }),
        
        // Tooltip for hovered segment
        hoveredSegment !== null && React.createElement(
          'g',
          { transform: `translate(${centerX + 20}, ${centerY - 100})` },
          React.createElement('rect', {
            x: -80,
            y: -20,
            width: 160,
            height: 60,
            rx: 5,
            ry: 5,
            fill: 'white',
            fillOpacity: 0.9,
            stroke: '#ccc'
          }),
          React.createElement('text', {
            x: 0,
            y: 0,
            textAnchor: 'middle',
            fontWeight: 'bold'
          }, segments[hoveredSegment].timeSlot),
          React.createElement('text', {
            x: 0,
            y: 20,
            textAnchor: 'middle'
          }, `${segments[hoveredSegment].count} occurrences`),
          React.createElement('text', {
            x: 0,
            y: 35,
            textAnchor: 'middle',
            fontSize: 10,
            fill: '#666'
          }, 'Click for details')
        ),
        
        // Legend
        React.createElement(
          'g',
          { transform: `translate(${width - 110}, ${height - 140})` },
          React.createElement('rect', {
            x: 0,
            y: 0,
            width: 100,
            height: 130,
            fill: 'white',
            fillOpacity: 0.9,
            rx: 4,
            stroke: '#ddd'
          }),
          React.createElement('text', {
            x: 10,
            y: 20,
            fontSize: 12,
            fontWeight: 'bold'
          }, 'Legend'),
          
          // Data point
          React.createElement('circle', { cx: 15, cy: 40, r: 5, fill: '#667eea' }),
          React.createElement('text', { x: 25, y: 43, fontSize: 10 }, 'Data point'),
          
          // Mean direction
          React.createElement('line', { x1: 10, y1: 60, x2: 20, y2: 60, stroke: '#ff4081', strokeWidth: 2, strokeDasharray: '5,5' }),
          React.createElement('circle', { cx: 20, cy: 60, r: 3, fill: '#ff4081' }),
          React.createElement('text', { x: 25, y: 63, fontSize: 10 }, 'Mean direction'),
          
          // Selected hour
          React.createElement('rect', { x: 10, y: 75, width: 10, height: 10, fill: getHighlightColor() }),
          React.createElement('text', { x: 25, y: 83, fontSize: 10 }, 'Selected hour'),
          
          // Count levels
          React.createElement('path', { d: 'M10,100 L20,100', stroke: '#ddd', strokeWidth: 1, strokeDasharray: '2,2' }),
          React.createElement('text', { x: 25, y: 103, fontSize: 10 }, 'Count levels'),
          
          // R value
          React.createElement('text', { x: 10, y: 120, fontSize: 9, fill: '#666' }, `R=${currentStats.concentration.toFixed(2)}`)
        )
      )
    ),
    
    // Selected segment details
    selectedSegment !== null && React.createElement(
      'div',
      { className: 'mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200' },
      React.createElement('h3', { className: 'font-bold text-lg text-blue-800' }, `${segments[selectedSegment].timeSlot} Details`),
      React.createElement('p', { className: 'font-medium' }, `Total occurrences: ${segments[selectedSegment].count}`),
      React.createElement('p', null, `This represents ${((segments[selectedSegment].count / currentStats.total) * 100).toFixed(1)}% of all activity`),
      
      viewMode === 'timeBlocks' && React.createElement(
        'div',
        { className: 'mt-2' },
        React.createElement('p', null, 
          React.createElement('span', { className: 'font-medium' }, 'Time range: '),
          `${formatHour(segments[selectedSegment].startHour)} to ${formatHour(segments[selectedSegment].endHour)}`
        )
      ),
      
      viewMode === 'overall' && React.createElement(
        'div',
        { className: 'mt-2' },
        React.createElement('p', { className: 'font-medium' }, 'Daily breakdown:'),
        React.createElement(
          'div',
          { className: 'grid grid-cols-3 gap-2 mt-1' },
          circularStatsData.dayStats.map((day, idx) => {
            const hourData = day.hourlyBreakdown.find(h => 
              getHourFromTimeSlot(h.timeSlot) === segments[selectedSegment].hour
            ) || { count: 0 };
            return React.createElement(
              'div',
              {
                key: idx,
                className: `p-2 rounded shadow-sm ${hourData.count > 0 ? 'bg-white' : 'bg-gray-100'}`
              },
              React.createElement('p', { className: 'font-medium' }, day.day),
              React.createElement('p', null, `${hourData.count} occurrences`)
            );
          })
        )
      )
    ),
    
    // Statistics section
    React.createElement(
      'div',
      { className: 'mt-6 w-full max-w-2xl bg-gray-50 p-4 rounded-lg text-sm' },
      React.createElement('h3', { className: 'font-semibold text-lg mb-2' }, 
        `Statistics for ${viewMode === 'daily' && selectedDay !== 'all' ? 
          `Day ${circularStatsData.dayStats[parseInt(selectedDay.replace('day', ''))].day}` : 'All Data'}`
      ),
      React.createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        // Left column stats
        React.createElement(
          'div',
          null,
          React.createElement('p', null, 
            React.createElement('span', { className: 'font-medium' }, 'Mean Time: '), 
            currentStats.meanTime
          ),
          React.createElement('p', null, 
            React.createElement('span', { className: 'font-medium' }, 'Concentration (R): '), 
            currentStats.concentration.toFixed(3)
          ),
          React.createElement('p', null, 
            React.createElement('span', { className: 'font-medium' }, 'Circular Variance: '), 
            currentStats.variance.toFixed(3)
          ),
          React.createElement('p', null, 
            React.createElement('span', { className: 'font-medium' }, 'Total Occurrences: '), 
            currentStats.total
          )
        ),
        // Right column stats
        React.createElement(
          'div',
          null,
          React.createElement('p', null, 
            React.createElement('span', { className: 'font-medium' }, 'Peak Activity: '), 
            `${circularStatsData.peakActivity.hourlyPeaks[0].timeSlot} (${circularStatsData.peakActivity.hourlyPeaks[0].count} occurrences)`
          ),
          React.createElement('p', null, 
            React.createElement('span', { className: 'font-medium' }, 'Peak Block: '), 
            `${circularStatsData.peakActivity.blockPeak} (${circularStatsData.timeBlocks.find(b => b.timeBlock.includes(circularStatsData.peakActivity.blockPeak.split('-')[0]))?.count || ''} occurrences)`
          ),
          React.createElement('p', null, 
            React.createElement('span', { className: 'font-medium' }, 'Uniformity Test: '), 
            circularStatsData.uniformityTests.rayleigh.pValue < 0.05 ? 
              "Non-uniform distribution (p < 0.05)" : "Uniform distribution"
          )
        )
      ),
      React.createElement('p', { className: 'mt-3 text-xs text-gray-600' },
        'Hover over segments to see details, click to select an hour for more information. ' +
        'Toggle between view modes to explore different perspectives of the data.'
      )
      ),
    
    //Plain Language Summary Section
    React.createElement(
    'div',
    { className: 'flex flex-col items-left' },
    // Title
    React.createElement('h2', { className: 'text-2xl font-bold mb-2' }, 'Plain Language Summary'),
    React.createElement('h3', { className: 'text-xl font-bold text-gray-600 mb-2'}, 'When Are Hospital Beds Allocated? Understanding Patterns in Bed Management Activities'),
    React.createElement('h4', { className: 'text-xl italic text-gray-600 mb-2' }, 'What We Studied'),
    React.createElement('p', { className: 'text-gray-600 mb-6' }, 'We wanted to understand when nursing staff in the bed management unit typically allocate beds to patients throughout the day and night, and whether these patterns change on different days. By analyzing data from nine days in March 2025, we tracked exactly when 558 bed allocation activities occurred at our urban hospital.'),
    )
  );
};

// Render the app
ReactDOM.render(
  React.createElement(CircularStatsRoseChart),
  document.getElementById('app')
);
