// Main Rose Chart Visualization using D3.js
document.addEventListener('DOMContentLoaded', function() {
  // State variables
  let viewMode = 'overall'; // 'overall', 'timeBlocks', 'daily'
  let selectedDay = 'all';
  let selectedSegment = null;
  let showLabels = true;
  let chartColorScheme = 'blues'; // 'blues', 'purples', 'greens', 'oranges'

  // DOM elements
  const chartContainer = document.getElementById('chart-container');
  const detailsPanel = document.getElementById('selected-details');
  const daySelector = document.querySelector('.day-selector');
  
  // Stats elements
  const statMeanTime = document.getElementById('stat-mean-time');
  const statConcentration = document.getElementById('stat-concentration');
  const statVariance = document.getElementById('stat-variance');
  const statTotal = document.getElementById('stat-total');
  const statPeak = document.getElementById('stat-peak');
  const statPeakBlock = document.getElementById('stat-peak-block');
  const statUniformity = document.getElementById('stat-uniformity');

  // Chart dimensions
  const containerWidth = chartContainer.clientWidth;
  const width = Math.min(containerWidth, 700);
  const height = width; // Square aspect ratio
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 80; // Leave space for labels and legend
  
  // Create SVG element
  const svg = d3.select('#chart-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`);
  
  // Add title
  const chartTitle = svg.append('text')
    .attr('x', centerX)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('font-weight', 'bold')
    .attr('font-size', '14px')
    .attr('fill', '#444')
    .text('Overall Activity by Hour');
  
  // Create tooltip
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);
  
  // Initialize day selector dropdown
  function initDaySelector() {
    const daySelect = document.getElementById('day-select');
    
    // Clear existing options
    daySelect.innerHTML = '<option value="all">All Days</option>';
    
    // Add options for each day
    circularStatsData.dayStats.forEach((day, idx) => {
      const option = document.createElement('option');
      option.value = `day${idx}`;
      option.textContent = day.day;
      daySelect.appendChild(option);
    });
  }
  
  // Helper functions
  
  // Format time from hour (0-23)
  function formatHour(hour) {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'am' : 'pm';
    return `${h}${ampm}`;
  }
  
  // Generate time label for an hour
  function generateTimeLabel(hour) {
    return `${formatHour(hour)}-${formatHour((hour + 1) % 24)}`;
  }
  
  // Helper to extract hour from time slot string
  function getHourFromTimeSlot(timeSlot) {
    const parts = timeSlot.split('-');
    return getHourFromTimeString(parts[0]);
  }
  
  // Helper to extract hour from time string (e.g. "8am", "12pm")
  function getHourFromTimeString(timeString) {
    const isPM = timeString.toLowerCase().includes('pm');
    const isAM = timeString.toLowerCase().includes('am');
    
    let hour = parseInt(timeString.replace(/[^0-9]/g, ''));
    
    if (isPM && hour !== 12) {
      hour += 12;
    } else if (isAM && hour === 12) {
      hour = 0;
    }
    
    return hour;
  }
  
  // Parse time string like "7:56pm" to angle in radians
  function parseTimeToRadians(timeString) {
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
  }
  
  // Get base color based on selected scheme
  function getBaseColor(intensity) {
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
  }
  
  // Get selected highlights color
  function getHighlightColor() {
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
  }
  
  // Get current data based on selected view and day
  function getCurrentData() {
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
          percentage: block.percentage
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
  }
  
  // Get circular statistics for the current view
  function getCurrentStats() {
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
  }
  
  // Update chart title based on current view
  function updateChartTitle() {
    let title = '';
    
    if (viewMode === 'overall') {
      title = 'Overall Activity by Hour';
    } else if (viewMode === 'timeBlocks') {
      title = 'Activity by 4-Hour Blocks';
    } else if (viewMode === 'daily') {
      if (selectedDay !== 'all') {
        const dayIndex = parseInt(selectedDay.replace('day', ''));
        title = `Activity by Hour (${circularStatsData.dayStats[dayIndex].day})`;
      } else {
        title = 'Activity by Hour (All Days)';
      }
    }
    
    chartTitle.text(title);
  }
  
  // Update statistics display
  function updateStats() {
    const stats = getCurrentStats();
    statMeanTime.textContent = stats.meanTime;
    statConcentration.textContent = stats.concentration.toFixed(3);
    statVariance.textContent = stats.variance.toFixed(3);
    statTotal.textContent = stats.total;
    
    statPeak.textContent = `${circularStatsData.peakActivity.hourlyPeaks[0].timeSlot} (${circularStatsData.peakActivity.hourlyPeaks[0].count})`;
    statPeakBlock.textContent = `${circularStatsData.peakActivity.blockPeak}`;
    
    const pValue = circularStatsData.uniformityTests.rayleigh.pValue;
    statUniformity.textContent = pValue < 0.05 ? "Non-uniform distribution (p < 0.05)" : "Uniform distribution";
  }
  
  // Draw the rose chart
  function drawChart() {
    // Clear previous chart
    svg.selectAll('g.segments, g.axis, g.meanDirection').remove();
    
    // Get current dataset based on view settings
    const currentData = getCurrentData();
    
    // Find max count for scaling
    const maxCount = Math.max(...currentData.map(d => d.count));
    
    // Calculate wedge angle based on view mode
    const wedgeAngle = viewMode === 'timeBlocks' ? (2 * Math.PI) / 6 : (2 * Math.PI) / 24;
    
    // Create value axis (circular grid lines)
    const axisGroup = svg.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(${centerX}, ${centerY})`);
      
    // Draw circular grid lines with labels
    for (let i = 1; i <= 4; i++) {
      const axisRadius = radius * (i / 4);
      const value = Math.ceil(maxCount * (i / 4));
      
      axisGroup.append('circle')
        .attr('r', axisRadius)
        .attr('fill', 'none')
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');
      
      if (showLabels) {
        axisGroup.append('text')
          .attr('x', 5)
          .attr('y', -axisRadius - 5)
          .attr('class', 'value-axis-label')
          .text(value);
      }
    }
    
    // Draw hour markers
    const hourStep = viewMode === 'timeBlocks' ? 4 : 1;
    for (let i = 0; i < 24; i += hourStep) {
      const angle = (i / 24) * 2 * Math.PI;
      const markerRadius = radius + 10;
      const x = Math.sin(angle) * markerRadius;
      const y = -Math.cos(angle) * markerRadius;
      
      let displayHour = i % 12 || 12;
      const ampm = i < 12 ? 'am' : 'pm';
      const label = `${displayHour}${ampm}`;
      
      const active = currentData.some(d => Math.abs(d.hour - i) < hourStep/2);
      
      if (showLabels) {
        axisGroup.append('text')
          .attr('x', x)
          .attr('y', y)
          .attr('class', 'hour-label')
          .attr('fill', active ? '#555' : '#999')
          .attr('font-weight', active ? 'bold' : 'normal')
          .text(label);
      }
    }
    
    // Draw mean direction indicator for overall and daily views
    if (viewMode !== 'timeBlocks') {
      const meanAngle = parseTimeToRadians(getCurrentStats().meanTime);
      const meanX = Math.sin(meanAngle) * radius;
      const meanY = -Math.cos(meanAngle) * radius;
      
      const meanGroup = svg.append('g')
        .attr('class', 'meanDirection')
        .attr('transform', `translate(${centerX}, ${centerY})`);
      
      meanGroup.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', meanX)
        .attr('y2', meanY)
        .attr('class', 'mean-indicator');
      
      meanGroup.append('circle')
        .attr('cx', meanX)
        .attr('cy', meanY)
        .attr('r', 4)
        .attr('class', 'mean-indicator-point');
      
      meanGroup.append('text')
        .attr('x', meanX)
        .attr('y', meanY - 15)
        .attr('class', 'mean-time-label')
        .text(getCurrentStats().meanTime);
    }
    
    // Create segments group
    const segmentsGroup = svg.append('g')
      .attr('class', 'segments')
      .attr('transform', `translate(${centerX}, ${centerY})`);
    
    // Generate and draw segments
    currentData.forEach((item, i) => {
      const startAngle = (item.hour / 24) * 2 * Math.PI - wedgeAngle / 2;
      const endAngle = startAngle + wedgeAngle;
      
      // Scale the radius based on count
      const segmentRadius = (item.count / maxCount) * radius * 0.9;
      
      // Create SVG arc path generator
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(segmentRadius)
        .startAngle(startAngle)
        .endAngle(endAngle);
      
      // Calculate color intensity
      const intensity = Math.max(30, Math.min(220, Math.floor(50 + (item.count / maxCount) * 180)));
      let fillColor = getBaseColor(intensity);
      
      // If this segment is selected, adjust color
      if (selectedSegment === i) {
        fillColor = getHighlightColor();
      }
      
      // Draw the segment
      const segment = segmentsGroup.append('path')
        .attr('d', arc)
        .attr('fill', fillColor)
        .attr('stroke', selectedSegment === i ? "#ff6b6b" : "#667eea")
        .attr('stroke-width', selectedSegment === i ? 2 : 1)
        .attr('opacity', selectedSegment !== null && selectedSegment !== i ? 0.6 : 0.95)
        .attr('class', 'segment')
        .classed('selected', selectedSegment === i);
      
      // Add click event
      segment.on('click', function() {
        if (selectedSegment === i) {
          // Deselect if already selected
          selectedSegment = null;
          detailsPanel.style.display = 'none';
        } else {
          // Select this segment
          selectedSegment = i;
          updateDetailsPanel(item, i);
        }
        
        // Redraw chart to update visuals
        drawChart();
      });
      
      // Add hover events
      segment.on('mouseover', function(event) {
        // Highlight the segment
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1);
        
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        
        tooltip.html(`
          <strong>${item.timeSlot}</strong><br>
          ${item.count} occurrences
          ${item.percentage ? `(${item.percentage}%)` : ''}
          <br><small>Click for details</small>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      });
      
      segment.on('mouseout', function() {
        // Return to normal
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', selectedSegment !== null && selectedSegment !== i ? 0.6 : 0.95);
        
        // Hide tooltip
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
      
      // Add count labels for significant segments
      if ((item.count > maxCount * 0.2) || selectedSegment === i || viewMode === 'timeBlocks') {
        const labelAngle = startAngle + wedgeAngle / 2;
        const labelRadius = segmentRadius * 0.5;
        const labelX = Math.sin(labelAngle) * labelRadius;
        const labelY = -Math.cos(labelAngle) * labelRadius;
        
        segmentsGroup.append('text')
          .attr('x', labelX)
          .attr('y', labelY)
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .attr('fill', '#fff')
          .attr('font-weight', 'bold')
          .attr('font-size', selectedSegment === i ? 12 : 10)
          .text(item.count);
        
        // Add percentage for time blocks
        if (viewMode === 'timeBlocks' && item.percentage) {
          segmentsGroup.append('text')
            .attr('x', labelX)
            .attr('y', labelY + 14)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', 9)
            .text(`(${item.percentage}%)`);
        }
      }
    });
    
    // Draw center point
    segmentsGroup.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 4)
      .attr('fill', '#667eea');
    
    // Add legend
    drawLegend();
  }
  
  // Draw the legend
  function drawLegend() {
    const legendGroup = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 110}, ${height - 140})`);
    
    // Background rectangle
    legendGroup.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 100)
      .attr('height', 130)
      .attr('fill', 'white')
      .attr('fill-opacity', 0.9)
      .attr('rx', 4)
      .attr('stroke', '#ddd');
    
    // Title
    legendGroup.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('font-size', 12)
      .attr('font-weight', 'bold')
      .text('Legend');
    
    // Data point
    legendGroup.append('circle')
      .attr('cx', 15)
      .attr('cy', 40)
      .attr('r', 5)
      .attr('fill', '#667eea');
    
    legendGroup.append('text')
      .attr('x', 25)
      .attr('y', 43)
      .attr('font-size', 10)
      .text('Data point');
    
    // Mean direction
    legendGroup.append('line')
      .attr('x1', 10)
      .attr('y1', 60)
      .attr('x2', 20)
      .attr('y2', 60)
      .attr('stroke', '#ff4081')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');
    
    legendGroup.append('circle')
      .attr('cx', 20)
      .attr('cy', 60)
      .attr('r', 3)
      .attr('fill', '#ff4081');
    
    legendGroup.append('text')
      .attr('x', 25)
      .attr('y', 63)
      .attr('font-size', 10)
      .text('Mean direction');
    
    // Selected hour
    legendGroup.append('rect')
      .attr('x', 10)
      .attr('y', 75)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', getHighlightColor());
    
    legendGroup.append('text')
      .attr('x', 25)
      .attr('y', 83)
      .attr('font-size', 10)
      .text('Selected hour');
    
    // Count levels
    legendGroup.append('path')
      .attr('d', 'M10,100 L20,100')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');
    
    legendGroup.append('text')
      .attr('x', 25)
      .attr('y', 103)
      .attr('font-size', 10)
      .text('Count levels');
    
    // R value
    legendGroup.append('text')
      .attr('x', 10)
      .attr('y', 120)
      .attr('font-size', 9)
      .attr('fill', '#666')
      .text(`R=${getCurrentStats().concentration.toFixed(2)}`);
  }
  
  // Update the details panel for selected segment
  function updateDetailsPanel(segmentData, index) {
    if (!segmentData) {
      detailsPanel.style.display = 'none';
      return;
    }
    
    // Make details panel visible
    detailsPanel.style.display = 'block';
    
    // Calculate percentage of total
    const currentStats = getCurrentStats();
    const percentage = ((segmentData.count / currentStats.total) * 100).toFixed(1);
    
    // Create HTML content
    let html = `
      <h3>${segmentData.timeSlot} Details</h3>
      <p style="font-weight: 500;">Total occurrences: ${segmentData.count}</p>
      <p>This represents ${percentage}% of all activity</p>
    `;
    
    // Add daily breakdown for overall view
    if (viewMode === 'overall') {
      html += `
        <div style="margin-top: 12px;">
          <p style="font-weight: 500;">Daily breakdown:</p>
          <div class="daily-breakdown">
      `;
      
      circularStatsData.dayStats.forEach((day, idx) => {
        const hourData = day.hourlyBreakdown.find(h => 
          getHourFromTimeSlot(h.timeSlot) === segmentData.hour
        ) || { count: 0 };
        
        html += `
          <div class="day-item" style="${hourData.count > 0 ? 'background-color: white' : 'background-color: #f1f5f9'}">
            <p>${day.day}</p>
            <p>${hourData.count} occurrences</p>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    }
    
    detailsPanel.innerHTML = html;
  }
  
  // Initialize event listeners
  function initEventListeners() {
    // View mode buttons
    document.getElementById('view-overall').addEventListener('click', function() {
      viewMode = 'overall';
      selectedSegment = null;
      daySelector.style.display = 'none';
      updateViewButtonStates();
      updateChartTitle();
      updateStats();
      drawChart();
    });
    
    document.getElementById('view-blocks').addEventListener('click', function() {
      viewMode = 'timeBlocks';
      selectedSegment = null;
      daySelector.style.display = 'none';
      updateViewButtonStates();
      updateChartTitle();
      updateStats();
      drawChart();
    });
    
    document.getElementById('view-daily').addEventListener('click', function() {
      viewMode = 'daily';
      selectedSegment = null;
      daySelector.style.display = 'block';
      updateViewButtonStates();
      updateChartTitle();
      updateStats();
      drawChart();
    });
    
    // Day selector
    document.getElementById('day-select').addEventListener('change', function(e) {
      selectedDay = e.target.value;
      selectedSegment = null;
      updateChartTitle();
      updateStats();
      drawChart();
    });
    
    // Color scheme selector
    document.getElementById('color-scheme').addEventListener('change', function(e) {
      chartColorScheme = e.target.value;
      drawChart();
    });
    
    // Toggle labels button
    document.getElementById('toggle-labels').addEventListener('click', function() {
      showLabels = !showLabels;
      drawChart();
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
      // Only redraw if container width changes
      const newWidth = chartContainer.clientWidth;
      if (Math.abs(newWidth - containerWidth) > 10) {
        // Redraw chart after short delay
        setTimeout(function() {
          svg.remove();
          initChart();
        }, 300);
      }
    });
  }
  
  // Update view button states (selected class)
  function updateViewButtonStates() {
    document.getElementById('view-overall').classList.toggle('selected', viewMode === 'overall');
    document.getElementById('view-blocks').classList.toggle('selected', viewMode === 'timeBlocks');
    document.getElementById('view-daily').classList.toggle('selected', viewMode === 'daily');
  }
  
  // Initialize chart
  function initChart() {
    // Create SVG element
    const containerWidth = chartContainer.clientWidth;
    const width = Math.min(containerWidth, 700);
    const height = width; // Square aspect ratio
    
    // Create SVG
    svg = d3.select('#chart-container')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    // Add title
    chartTitle = svg.append('text')
      .attr('x', centerX)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .attr('fill', '#444')
      .text('Overall Activity by Hour');
    
    // Draw chart
    drawChart();
  }
  
  // Initialize the visualization
  function init() {
    initDaySelector();
    initEventListeners();
    updateStats();
    
    // Hide day selector initially (only visible in daily view)
    daySelector.style.display = 'none';
    
    // Draw initial chart
    drawChart();
  }
  
  // Start the visualization
  init();
});
