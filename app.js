// Main application script for Circular Time Statistics Visualization
document.addEventListener('DOMContentLoaded', function() {
  // Show loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loadingSpinner';
  loadingIndicator.className = 'loading';
  loadingIndicator.textContent = 'Loading data';
  document.getElementById('root').appendChild(loadingIndicator);

  // Load data
  fetch('data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      // Initialize the dashboard with the data
      initializeDashboard(data);
      // Hide loading spinner
      document.getElementById('loadingSpinner').style.display = 'none';
    })
    .catch(error => {
      console.error('Error loading data:', error);
      alert('Error loading data. Please check console for details.');
      document.getElementById('loadingSpinner').style.display = 'none';
    });
});

function initializeDashboard(circularStatsData) {
  // Create main container
  const mainContainer = document.createElement('div');
  mainContainer.className = 'max-w-6xl mx-auto p-4';
  document.getElementById('root').appendChild(mainContainer);

  // Add header
  const header = document.createElement('header');
  header.className = 'mb-8 text-center';
  header.innerHTML = `
    <h1 class="text-3xl font-bold mb-2">Circular Time Statistics Visualization</h1>
    <p class="text-gray-600">Analysis of temporal patterns from ${circularStatsData.metadata.dataSource}</p>
  `;
  mainContainer.appendChild(header);

  // Create tabs container
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'mb-6';
  tabsContainer.innerHTML = `
    <ul class="flex border-b border-gray-200">
      <li id="tab-overall" class="mr-1 active-tab">
        <button class="bg-white inline-block py-2 px-4 text-blue-600 font-semibold border-l border-t border-r rounded-t">
          Overall Distribution
        </button>
      </li>
      <li id="tab-timeblocks" class="mr-1">
        <button class="bg-gray-200 inline-block py-2 px-4 text-gray-700 font-semibold border-l border-t border-r rounded-t">
          Time Blocks
        </button>
      </li>
      <li id="tab-daily" class="mr-1">
        <button class="bg-gray-200 inline-block py-2 px-4 text-gray-700 font-semibold border-l border-t border-r rounded-t">
          Daily Analysis
        </button>
      </li>
      <li id="tab-statistics" class="mr-1">
        <button class="bg-gray-200 inline-block py-2 px-4 text-gray-700 font-semibold border-l border-t border-r rounded-t">
          Statistical Tests
        </button>
      </li>
    </ul>
  `;
  mainContainer.appendChild(tabsContainer);

  // Create tab content container
  const tabContent = document.createElement('div');
  tabContent.id = 'tab-content';
  tabContent.className = 'bg-white p-4 rounded-lg border border-gray-200';
  mainContainer.appendChild(tabContent);

  // Initialize tabs
  initializeOverallTab(circularStatsData, tabContent);
  
  // Set up tab switching
  setupTabNavigation(circularStatsData, tabContent);
  
  // Add footer
  const footer = document.createElement('footer');
  footer.className = 'mt-8 text-center text-gray-600 text-sm';
  footer.innerHTML = `
    <p>Analysis generated on <span id="footerDate">${circularStatsData.metadata.analysisDate}</span></p>
    <p>Total observations: ${circularStatsData.metadata.totalObservations} | Data source: ${circularStatsData.metadata.dataSource}</p>
  `;
  mainContainer.appendChild(footer);
}

function setupTabNavigation(data, tabContent) {
  // Get tab elements
  const overallTab = document.getElementById('tab-overall');
  const timeBlocksTab = document.getElementById('tab-timeblocks');
  const dailyTab = document.getElementById('tab-daily');
  const statisticsTab = document.getElementById('tab-statistics');
  
  // Add click handlers
  overallTab.addEventListener('click', function() {
    setActiveTab(overallTab);
    initializeOverallTab(data, tabContent);
  });
  
  timeBlocksTab.addEventListener('click', function() {
    setActiveTab(timeBlocksTab);
    initializeTimeBlocksTab(data, tabContent);
  });
  
  dailyTab.addEventListener('click', function() {
    setActiveTab(dailyTab);
    initializeDailyTab(data, tabContent);
  });
  
  statisticsTab.addEventListener('click', function() {
    setActiveTab(statisticsTab);
    initializeStatisticsTab(data, tabContent);
  });
}

function setActiveTab(activeTab) {
  // Get all tabs
  const tabs = document.querySelectorAll('#tab-overall, #tab-timeblocks, #tab-daily, #tab-statistics');
  
  // Remove active class from all tabs
  tabs.forEach(tab => {
    tab.querySelector('button').className = 'bg-gray-200 inline-block py-2 px-4 text-gray-700 font-semibold border-l border-t border-r rounded-t';
    tab.className = 'mr-1';
  });
  
  // Add active class to selected tab
  activeTab.querySelector('button').className = 'bg-white inline-block py-2 px-4 text-blue-600 font-semibold border-l border-t border-r rounded-t';
  activeTab.className = 'mr-1 active-tab';
}

function initializeOverallTab(data, tabContent) {
  // Clear tab content
  tabContent.innerHTML = '';
  
  // Create container for visualization
  const vizContainer = document.createElement('div');
  vizContainer.className = 'flex flex-col items-center';
  
  // Add title and description
  vizContainer.innerHTML = `
    <h2 class="text-2xl font-bold mb-2">Hourly Activity Distribution</h2>
    <p class="text-gray-600 mb-4">24-hour distribution of activities from ${data.metadata.dataSource}</p>
  `;
  
  // Create controls div
  const controls = document.createElement('div');
  controls.className = 'flex flex-wrap justify-center items-center gap-3 mb-4';
  controls.innerHTML = `
    <div class="p-2 bg-gray-50 rounded-lg border border-gray-200">
      <label class="font-medium mr-2">Color Scheme:</label>
      <select id="colorSchemeSelect" class="px-2 py-1 border rounded">
        <option value="blues">Blues</option>
        <option value="purples">Purples</option>
        <option value="greens">Greens</option>
        <option value="oranges">Oranges</option>
      </select>
    </div>
    
    <button id="toggleLabelsBtn" class="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100">
      Hide Labels
    </button>
  `;
  vizContainer.appendChild(controls);
  
  // Create rose chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'relative';
  chartContainer.innerHTML = `
    <div id="hourlyRoseChart" style="width: 650px; height: 650px;"></div>
  `;
  vizContainer.appendChild(chartContainer);
  
  // Create summary container
  const summaryContainer = document.createElement('div');
  summaryContainer.className = 'mt-6 w-full max-w-2xl bg-gray-50 p-4 rounded-lg text-sm';
  summaryContainer.innerHTML = `
    <h3 class="font-semibold text-lg mb-2">Overall Statistics</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p><span class="font-medium">Mean Time:</span> ${data.summary.meanDirection.time}</p>
        <p><span class="font-medium">Concentration (R):</span> ${data.summary.concentration.meanResultantLength.toFixed(3)}</p>
        <p><span class="font-medium">Circular Variance:</span> ${data.summary.variance.circularVariance.toFixed(3)}</p>
        <p><span class="font-medium">Total Observations:</span> ${data.metadata.totalObservations}</p>
      </div>
      <div>
        <p><span class="font-medium">Peak Hour:</span> ${data.peakActivity.hourlyPeaks[0].timeSlot} (${data.peakActivity.hourlyPeaks[0].count} occurrences)</p>
        <p><span class="font-medium">Peak Block:</span> ${data.peakActivity.blockPeak}</p>
        <p><span class="font-medium">Uniformity Test:</span> ${data.uniformityTests.rayleigh.pValue < 0.05 ? "Non-uniform distribution (p < 0.05)" : "Uniform distribution"}</p>
        <p><span class="font-medium">95% Confidence Interval:</span> ${data.summary.confidenceInterval.lowerBound} - ${data.summary.confidenceInterval.upperBound}</p>
      </div>
    </div>
    <div class="mt-4">
      <h4 class="font-medium mb-1">Key Findings:</h4>
      <ul class="list-disc pl-5">
        <li>Peak activity occurs between ${data.peakActivity.hourlyPeaks[0].timeSlot} with ${data.peakActivity.hourlyPeaks[0].count} observations.</li>
        <li>Rayleigh test (p=${data.uniformityTests.rayleigh.pValue.toExponential(2)}) strongly rejects the hypothesis of uniform distribution around the clock.</li>
        <li>The mean direction of ${data.summary.meanDirection.time} has a 95% confidence interval of ${data.summary.confidenceInterval.lowerBound} - ${data.summary.confidenceInterval.upperBound}.</li>
        <li>The concentration parameter (R) of ${data.summary.concentration.meanResultantLength.toFixed(3)} indicates a moderate clustering of times.</li>
      </ul>
    </div>
  `;
  vizContainer.appendChild(summaryContainer);
  
  // Add to tab content
  tabContent.appendChild(vizContainer);
  
  // Create the visualization
  createRoseChart('hourlyRoseChart', data, 'overall');
  
  // Set up event handlers for controls
  document.getElementById('colorSchemeSelect').addEventListener('change', function(e) {
    createRoseChart('hourlyRoseChart', data, 'overall', e.target.value);
  });
  
  document.getElementById('toggleLabelsBtn').addEventListener('click', function(e) {
    const button = e.target;
    const showLabels = button.textContent.includes('Hide');
    if (showLabels) {
      button.textContent = 'Show Labels';
    } else {
      button.textContent = 'Hide Labels';
    }
    createRoseChart('hourlyRoseChart', data, 'overall', document.getElementById('colorSchemeSelect').value, !showLabels);
  });
}

function initializeTimeBlocksTab(data, tabContent) {
  // Clear tab content
  tabContent.innerHTML = '';
  
  // Create container for visualization
  const vizContainer = document.createElement('div');
  vizContainer.className = 'flex flex-col items-center';
  
  // Add title and description
  vizContainer.innerHTML = `
    <h2 class="text-2xl font-bold mb-2">Time Block Analysis</h2>
    <p class="text-gray-600 mb-4">Activity distribution by 4-hour time blocks</p>
  `;
  
  // Create controls div
  const controls = document.createElement('div');
  controls.className = 'flex flex-wrap justify-center items-center gap-3 mb-4';
  controls.innerHTML = `
    <div class="p-2 bg-gray-50 rounded-lg border border-gray-200">
      <label class="font-medium mr-2">Color Scheme:</label>
      <select id="timeBlockColorScheme" class="px-2 py-1 border rounded">
        <option value="blues">Blues</option>
        <option value="purples">Purples</option>
        <option value="greens">Greens</option>
        <option value="oranges">Oranges</option>
      </select>
    </div>
    
    <button id="timeBlockToggleLabels" class="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100">
      Hide Labels
    </button>
  `;
  vizContainer.appendChild(controls);
  
  // Create rose chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'relative';
  chartContainer.innerHTML = `
    <div id="timeBlockRoseChart" style="width: 650px; height: 650px;"></div>
  `;
  vizContainer.appendChild(chartContainer);
  
  // Create time blocks table
  const tableContainer = document.createElement('div');
  tableContainer.className = 'mt-6 w-full max-w-2xl bg-gray-50 p-4 rounded-lg text-sm';
  
  let tableHtml = `
    <h3 class="font-semibold text-lg mb-3">Time Block Statistics</h3>
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th class="border border-gray-300 p-2 text-left">Time Block</th>
          <th class="border border-gray-300 p-2 text-left">Count</th>
          <th class="border border-gray-300 p-2 text-left">Percentage</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  data.timeBlocks.forEach(block => {
    tableHtml += `
      <tr>
        <td class="border border-gray-300 p-2">${block.timeBlock}</td>
        <td class="border border-gray-300 p-2">${block.count}</td>
        <td class="border border-gray-300 p-2">${block.percentage}%</td>
      </tr>
    `;
  });
  
  tableHtml += `
      </tbody>
    </table>
    <div class="mt-4">
      <h4 class="font-medium mb-1">Observations:</h4>
      <ul class="list-disc pl-5">
        <li>The ${data.peakActivity.blockPeak} block has the highest activity (${data.timeBlocks.find(b => b.timeBlock === data.peakActivity.blockPeak).percentage}% of total).</li>
        <li>Evening hours (4pm-8pm) and early morning hours (12am-4am) show the highest activity levels.</li>
        <li>Activity is more evenly distributed throughout the day than might be expected.</li>
      </ul>
    </div>
  `;
  
  tableContainer.innerHTML = tableHtml;
  vizContainer.appendChild(tableContainer);
  
  // Add to tab content
  tabContent.appendChild(vizContainer);
  
  // Create the visualization
  createRoseChart('timeBlockRoseChart', data, 'timeBlocks');
  
  // Set up event handlers for controls
  document.getElementById('timeBlockColorScheme').addEventListener('change', function(e) {
    createRoseChart('timeBlockRoseChart', data, 'timeBlocks', e.target.value);
  });
  
  document.getElementById('timeBlockToggleLabels').addEventListener('click', function(e) {
    const button = e.target;
    const showLabels = button.textContent.includes('Hide');
    if (showLabels) {
      button.textContent = 'Show Labels';
    } else {
      button.textContent = 'Hide Labels';
    }
    createRoseChart('timeBlockRoseChart', data, 'timeBlocks', document.getElementById('timeBlockColorScheme').value, !showLabels);
  });
}

function initializeDailyTab(data, tabContent) {
  // Clear tab content
  tabContent.innerHTML = '';
  
  // Create container for visualization
  const vizContainer = document.createElement('div');
  vizContainer.className = 'flex flex-col items-center';
  
  // Add title and description
  vizContainer.innerHTML = `
    <h2 class="text-2xl font-bold mb-2">Daily Activity Patterns</h2>
    <p class="text-gray-600 mb-4">Comparing activity distributions by day</p>
  `;
  
  // Create controls div
  const controls = document.createElement('div');
  controls.className = 'flex flex-wrap justify-center items-center gap-3 mb-4';
  
  let dayOptions = '<option value="all">All Days</option>';
  data.dayStats.forEach((day, idx) => {
    dayOptions += `<option value="day${idx}">${day.day}</option>`;
  });
  
  controls.innerHTML = `
    <div class="p-2 bg-gray-50 rounded-lg border border-gray-200">
      <label class="font-medium mr-2">Day:</label>
      <select id="daySelect" class="px-2 py-1 border rounded">
        ${dayOptions}
      </select>
    </div>
    
    <div class="p-2 bg-gray-50 rounded-lg border border-gray-200">
      <label class="font-medium mr-2">Color Scheme:</label>
      <select id="dailyColorScheme" class="px-2 py-1 border rounded">
        <option value="blues">Blues</option>
        <option value="purples">Purples</option>
        <option value="greens">Greens</option>
        <option value="oranges">Oranges</option>
      </select>
    </div>
    
    <button id="dailyToggleLabels" class="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100">
      Hide Labels
    </button>
  `;
  vizContainer.appendChild(controls);
  
  // Create rose chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'relative';
  chartContainer.innerHTML = `
    <div id="dailyRoseChart" style="width: 650px; height: 650px;"></div>
  `;
  vizContainer.appendChild(chartContainer);
  
  // Create daily stats table
  const tableContainer = document.createElement('div');
  tableContainer.className = 'mt-6 w-full max-w-2xl bg-gray-50 p-4 rounded-lg text-sm';
  tableContainer.innerHTML = `
    <h3 class="font-semibold text-lg mb-3">Daily Statistics</h3>
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th class="border border-gray-300 p-2 text-left">Day</th>
          <th class="border border-gray-300 p-2 text-left">Mean Time</th>
          <th class="border border-gray-300 p-2 text-left">Concentration</th>
          <th class="border border-gray-300 p-2 text-left">Variance</th>
          <th class="border border-gray-300 p-2 text-left">Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.dayStats.map(day => `
          <tr>
            <td class="border border-gray-300 p-2">${day.day}</td>
            <td class="border border-gray-300 p-2">${day.meanTime}</td>
            <td class="border border-gray-300 p-2">${day.concentration.toFixed(3)}</td>
            <td class="border border-gray-300 p-2">${day.variance.toFixed(3)}</td>
            <td class="border border-gray-300 p-2">${day.total}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="mt-4">
      <h4 class="font-medium mb-1">Day-to-Day Observations:</h4>
      <ul class="list-disc pl-5">
        <li>Day ${data.dayStats.find(d => d.concentration === Math.max(...data.dayStats.map(d => d.concentration))).day} has the highest concentration (least variance) in its time distribution.</li>
        <li>Day ${data.dayStats.find(d => d.concentration === Math.min(...data.dayStats.map(d => d.concentration))).day} has the lowest concentration (most variance) in its time distribution.</li>
        <li>Mean direction times vary from ${data.dayStats.find(d => {
          const times = data.dayStats.map(d => d.meanTime);
          return d.meanTime === times.sort()[0];
        }).meanTime} to ${data.dayStats.find(d => {
          const times = data.dayStats.map(d => d.meanTime);
          return d.meanTime === times.sort()[times.length-1];
        }).meanTime}.</li>
      </ul>
    </div>
  `;
  vizContainer.appendChild(tableContainer);
  
  // Add to tab content
  tabContent.appendChild(vizContainer);
  
  // Create the visualization
  createRoseChart('dailyRoseChart', data, 'daily', 'blues', false, 'all');
  
  // Set up event handlers for controls
  document.getElementById('daySelect').addEventListener('change', function(e) {
    createRoseChart(
      'dailyRoseChart', 
      data, 
      'daily', 
      document.getElementById('dailyColorScheme').value, 
      document.getElementById('dailyToggleLabels').textContent.includes('Show'), 
      e.target.value
    );
  });
  
  document.getElementById('dailyColorScheme').addEventListener('change', function(e) {
    createRoseChart(
      'dailyRoseChart', 
      data, 
      'daily', 
      e.target.value, 
      document.getElementById('dailyToggleLabels').textContent.includes('Show'), 
      document.getElementById('daySelect').value
    );
  });
  
  document.getElementById('dailyToggleLabels').addEventListener('click', function(e) {
    const button = e.target;
    const showLabels = button.textContent.includes('Hide');
    if (showLabels) {
      button.textContent = 'Show Labels';
    } else {
      button.textContent = 'Hide Labels';
    }
    createRoseChart(
      'dailyRoseChart', 
      data, 
      'daily', 
      document.getElementById('dailyColorScheme').value, 
      !showLabels, 
      document.getElementById('daySelect').value
    );
  });
}

function initializeStatisticsTab(data, tabContent) {
  // Clear tab content
  tabContent.innerHTML = '';
  
  // Create statistical analysis container
  const statsContainer = document.createElement('div');
  statsContainer.className = 'max-w-4xl mx-auto';
  
  // Build the content
  statsContainer.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">Statistical Analysis</h2>
    
    <div class="mb-6 bg-white p-4 rounded-lg border border-gray-200">
      <h3 class="text-xl font-semibold mb-3">Circular Statistics</h3>
      
      <div class="mb-4">
        <h4 class="font-medium mb-2">Descriptive Statistics</h4>
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th class="border border-gray-300 p-2 text-left">Time Slot</th>
              <th class="border border-gray-300 p-2 text-left">Count</th>
              <th class="border border-gray-300 p-2 text-left">Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${data.peakActivity.hourlyPeaks.map((peak, index) => `
              <tr>
                <td class="border border-gray-300 p-2">${peak.timeSlot}</td>
                <td class="border border-gray-300 p-2">${peak.count}</td>
                <td class="border border-gray-300 p-2">${((peak.count / data.metadata.totalObservations) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div>
        <h4 class="font-medium mb-2">Time Block Analysis</h4>
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th class="border border-gray-300 p-2 text-left">Time Block</th>
              <th class="border border-gray-300 p-2 text-left">Count</th>
              <th class="border border-gray-300 p-2 text-left">Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${data.timeBlocks.map(block => `
              <tr class="${block.timeBlock === data.peakActivity.blockPeak ? 'bg-blue-50' : ''}">
                <td class="border border-gray-300 p-2">${block.timeBlock}</td>
                <td class="border border-gray-300 p-2">${block.count}</td>
                <td class="border border-gray-300 p-2">${block.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="mt-2 text-sm text-gray-600">Highlighted row indicates peak time block.</p>
      </div>
    </div>
    
    <div class="bg-white p-4 rounded-lg border border-gray-200">
      <h3 class="text-xl font-semibold mb-3">Interpretation & Implications</h3>
      
      <div class="mb-4">
        <h4 class="font-medium mb-2">Key Findings</h4>
        <ul class="list-disc pl-5">
          <li>Based on the Rayleigh test (p = ${data.uniformityTests.rayleigh.pValue.toExponential(4)}), we can reject the null hypothesis of uniform distribution of events throughout the day.</li>
          <li>The mean time of ${data.summary.meanDirection.time} suggests that activity tends to cluster in the evening hours.</li>
          <li>With a concentration parameter (R) of ${data.summary.concentration.meanResultantLength.toFixed(3)}, the distribution shows moderate temporal clustering.</li>
          <li>The highest hourly peak is at ${data.peakActivity.hourlyPeaks[0].timeSlot} with ${data.peakActivity.hourlyPeaks[0].count} occurrences (${((data.peakActivity.hourlyPeaks[0].count / data.metadata.totalObservations) * 100).toFixed(1)}% of total).</li>
          <li>The time block from ${data.peakActivity.blockPeak} accounts for ${data.timeBlocks.find(b => b.timeBlock === data.peakActivity.blockPeak).percentage}% of all occurrences.</li>
        </ul>
      </div>
      
      <div>
        <h4 class="font-medium mb-2">Practical Implications</h4>
        <ul class="list-disc pl-5">
          <li>Resource allocation should be adjusted to account for peak activity periods.</li>
          <li>Staff scheduling should be optimized to ensure adequate coverage during peak hours.</li>
          <li>The non-uniform distribution suggests that time-based interventions could be targeted to specific periods.</li>
          <li>Day-to-day variations in activity patterns should be considered when designing temporal interventions.</li>
        </ul>
      </div>
    </div>
  `;
  
  // Add to tab content
  tabContent.appendChild(statsContainer);
}

function createRoseChart(containerId, data, viewMode, colorScheme = 'blues', hideLabels = false, selectedDay = 'all') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Chart dimensions
  const width = 650;
  const height = 650;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 80; // Leave space for labels and legend
  
  // Create SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  container.appendChild(svg);
  
  // Get current data based on selected view and day
  const currentData = getCurrentData(data, viewMode, selectedDay);
  const currentStats = getCurrentStats(data, viewMode, selectedDay);
  
  // Calculate wedge angle based on view mode
  const wedgeAngle = viewMode === 'timeBlocks' ? (2 * Math.PI) / 6 : (2 * Math.PI) / 24;
  
  // Find max count for scaling
  const maxCount = Math.max(...currentData.map(d => d.count));
  
  // Add title
  const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
  title.setAttribute("x", centerX);
  title.setAttribute("y", 20);
  title.setAttribute("font-size", "14");
  title.setAttribute("font-weight", "bold");
  title.setAttribute("text-anchor", "middle");
  title.setAttribute("fill", "#444");
  title.textContent = getTitleText(viewMode, selectedDay, data);
  svg.appendChild(title);
  
  // Create value axis labels
  for (let i = 1; i <= 4; i++) {
    const axisValue = Math.ceil(maxCount * (i / 4));
    const axisRadius = radius * (i / 4);
    
    // Draw circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", centerX);
    circle.setAttribute("cy", centerY);
    circle.setAttribute("r", axisRadius);
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "#ddd");
    circle.setAttribute("stroke-width", "1");
    circle.setAttribute("stroke-dasharray", "4,4");
    svg.appendChild(circle);
    
    // Add value label if not hidden
    if (!hideLabels) {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", centerX + 5);
      label.setAttribute("y", centerY - axisRadius - 5);
      label.setAttribute("font-size", "9");
      label.setAttribute("fill", "#777");
      label.textContent = axisValue;
      svg.appendChild(label);
    }
  }
  
  // Add mean direction indicator if not in timeBlocks view
  if (viewMode !== 'timeBlocks') {
    const meanAngle = parseTimeToRadians(currentStats.meanTime);
    
    // Draw line
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", centerX);
    line.setAttribute("y1", centerY);
    line.setAttribute("x2", centerX + Math.sin(meanAngle) * radius);
    line.setAttribute("y2", centerY - Math.cos(meanAngle) * radius);
    line.setAttribute("stroke", "#ff4081");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(line);
    
    // Draw circle at end
    const endCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    endCircle.setAttribute("cx", centerX + Math.sin(meanAngle) * radius);
    endCircle.setAttribute("cy", centerY - Math.cos(meanAngle) * radius);
    endCircle.setAttribute("r", "4");
    endCircle.setAttribute("fill", "#ff4081");
    svg.appendChild(endCircle);
    
    // Add time label
    const timeLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    timeLabel.setAttribute("x", centerX + Math.sin(meanAngle) * (radius + 15));
    timeLabel.setAttribute("y", centerY - Math.cos(meanAngle) * (radius + 15));
    timeLabel.setAttribute("font-size", "10");
    timeLabel.setAttribute("fill", "#ff4081");
    timeLabel.setAttribute("font-weight", "bold");
    timeLabel.setAttribute("text-anchor", "middle");
    timeLabel.textContent = currentStats.meanTime;
    svg.appendChild(timeLabel);
  }
  
  // Generate segments
  currentData.forEach((item, i) => {
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
    const path = [
      `M ${centerX} ${centerY}`,
      `L ${startX} ${startY}`,
      `A ${segmentRadius} ${segmentRadius} 0 0 1 ${endX} ${endY}`,
      'Z'
    ].join(' ');
    
    // Calculate color intensity based on count
    const intensity = Math.max(30, Math.min(220, Math.floor(50 + (item.count / maxCount) * 180)));
    const fillColor = getColorFromScheme(intensity, colorScheme);
    
    // Create segment path
    const segment = document.createElementNS("http://www.w3.org/2000/svg", "path");
    segment.setAttribute("d", path);
    segment.setAttribute("fill", fillColor);
    segment.setAttribute("stroke", "#667eea");
    segment.setAttribute("stroke-width", "1");
    segment.setAttribute("opacity", "0.95");
    segment.setAttribute("data-hour", item.hour);
    segment.setAttribute("data-count", item.count);
    segment.setAttribute("data-timeslot", item.timeSlot);
    segment.setAttribute("class", "segment");
    
    // Add hover and click events
    segment.addEventListener('mouseenter', function() {
      this.setAttribute("opacity", "0.8");
      showTooltip(svg, centerX + 20, centerY - 100, item.timeSlot, item.count);
    });
    
    segment.addEventListener('mouseleave', function() {
      this.setAttribute("opacity", "0.95");
      hideTooltip(svg);
    });
    
    svg.appendChild(segment);
    
    // Add count label for significant segments or in timeBlocks view
    if ((item.count > maxCount * 0.2) || viewMode === 'timeBlocks') {
      const valueAngle = (item.hour / 24) * 2 * Math.PI;
      const valueRadius = (item.count / maxCount) * radius * 0.5;
      const valueX = centerX + Math.sin(valueAngle) * valueRadius;
      const valueY = centerY - Math.cos(valueAngle) * valueRadius;
      
      const countLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      countLabel.setAttribute("x", valueX);
      countLabel.setAttribute("y", valueY);
      countLabel.setAttribute("font-size", "10");
      countLabel.setAttribute("font-weight", "bold");
      countLabel.setAttribute("text-anchor", "middle");
      countLabel.setAttribute("alignment-baseline", "middle");
      countLabel.setAttribute("fill", "#fff");
      countLabel.textContent = item.count;
      svg.appendChild(countLabel);
      
      // Add percentage for time blocks
      if (viewMode === 'timeBlocks' && item.percentage) {
        const percentLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        percentLabel.setAttribute("x", valueX);
        percentLabel.setAttribute("y", valueY + 14);
        percentLabel.setAttribute("font-size", "9");
        percentLabel.setAttribute("text-anchor", "middle");
        percentLabel.setAttribute("fill", "#fff");
        percentLabel.textContent = `(${item.percentage}%)`;
        svg.appendChild(percentLabel);
      }
    }
  });
  
  // Add center point
  const centerPoint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  centerPoint.setAttribute("cx", centerX);
  centerPoint.setAttribute("cy", centerY);
  centerPoint.setAttribute("r", "4");
  centerPoint.setAttribute("fill", "#667eea");
  svg.appendChild(centerPoint);
  
  // Add hour labels
  if (!hideLabels) {
    const hourStep = viewMode === 'timeBlocks' ? 4 : 1;
    for (let i = 0; i < 24; i += hourStep) {
      const angle = (i / 24) * 2 * Math.PI;
      const markerRadius = radius + 10;
      const x = centerX + Math.sin(angle) * markerRadius;
      const y = centerY - Math.cos(angle) * markerRadius;
      
      let displayHour = i % 12 || 12;
      const ampm = i < 12 ? 'am' : 'pm';
      const label = `${displayHour}${ampm}`;
      
      const hourLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      hourLabel.setAttribute("x", x);
      hourLabel.setAttribute("y", y);
      hourLabel.setAttribute("font-size", "10");
      hourLabel.setAttribute("font-weight", 
        currentData.some(d => Math.abs(d.hour - i) < hourStep/2) ? "bold" : "normal");
      hourLabel.setAttribute("text-anchor", "middle");
      hourLabel.setAttribute("alignment-baseline", "middle");
      hourLabel.setAttribute("fill", 
        currentData.some(d => Math.abs(d.hour - i) < hourStep/2) ? "#555" : "#999");
      hourLabel.textContent = label;
      svg.appendChild(hourLabel);
    }
  }
  
  // Add legend
  const legend = document.createElementNS("http://www.w3.org/2000/svg", "g");
  legend.setAttribute("transform", `translate(${width - 110}, ${height - 140})`);
  
  // Legend background
  const legendBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  legendBg.setAttribute("x", "0");
  legendBg.setAttribute("y", "0");
  legendBg.setAttribute("width", "100");
  legendBg.setAttribute("height", "130");
  legendBg.setAttribute("fill", "white");
  legendBg.setAttribute("fill-opacity", "0.9");
  legendBg.setAttribute("rx", "4");
  legendBg.setAttribute("stroke", "#ddd");
  legend.appendChild(legendBg);
  
  // Legend title
  const legendTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
  legendTitle.setAttribute("x", "10");
  legendTitle.setAttribute("y", "20");
  legendTitle.setAttribute("font-size", "12");
  legendTitle.setAttribute("font-weight", "bold");
  legendTitle.textContent = "Legend";
  legend.appendChild(legendTitle);
  
  // Data point
  const dataPointCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dataPointCircle.setAttribute("cx", "15");
  dataPointCircle.setAttribute("cy", "40");
  dataPointCircle.setAttribute("r", "5");
  dataPointCircle.setAttribute("fill", "#667eea");
  legend.appendChild(dataPointCircle);
  
  const dataPointLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  dataPointLabel.setAttribute("x", "25");
  dataPointLabel.setAttribute("y", "43");
  dataPointLabel.setAttribute("font-size", "10");
  dataPointLabel.textContent = "Data point";
  legend.appendChild(dataPointLabel);
  
  // Mean direction
  const meanLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  meanLine.setAttribute("x1", "10");
  meanLine.setAttribute("y1", "60");
  meanLine.setAttribute("x2", "20");
  meanLine.setAttribute("y2", "60");
  meanLine.setAttribute("stroke", "#ff4081");
  meanLine.setAttribute("stroke-width", "2");
  meanLine.setAttribute("stroke-dasharray", "5,5");
  legend.appendChild(meanLine);
  
  const meanCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  meanCircle.setAttribute("cx", "20");
  meanCircle.setAttribute("cy", "60");
  meanCircle.setAttribute("r", "3");
  meanCircle.setAttribute("fill", "#ff4081");
  legend.appendChild(meanCircle);
  
  const meanLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  meanLabel.setAttribute("x", "25");
  meanLabel.setAttribute("y", "63");
  meanLabel.setAttribute("font-size", "10");
  meanLabel.textContent = "Mean direction";
  legend.appendChild(meanLabel);
  
  // Count levels
  const levelLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
  levelLine.setAttribute("d", "M10,100 L20,100");
  levelLine.setAttribute("stroke", "#ddd");
  levelLine.setAttribute("stroke-width", "1");
  levelLine.setAttribute("stroke-dasharray", "2,2");
  legend.appendChild(levelLine);
  
  const levelLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  levelLabel.setAttribute("x", "25");
  levelLabel.setAttribute("y", "103");
  levelLabel.setAttribute("font-size", "10");
  levelLabel.textContent = "Count levels";
  legend.appendChild(levelLabel);
  
  // R value
  const rLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  rLabel.setAttribute("x", "10");
  rLabel.setAttribute("y", "120");
  rLabel.setAttribute("font-size", "9");
  rLabel.setAttribute("fill", "#666");
  rLabel.textContent = `R=${currentStats.concentration.toFixed(2)}`;
  legend.appendChild(rLabel);
  
  svg.appendChild(legend);
}

function getCurrentData(data, viewMode, selectedDay = 'all') {
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
}

function getCurrentStats(data, viewMode, selectedDay = 'all') {
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
}

function getTitleText(viewMode, selectedDay, data) {
  if (viewMode === 'overall') {
    return 'Overall Activity by Hour';
  } else if (viewMode === 'timeBlocks') {
    return 'Activity by 4-Hour Blocks';
  } else if (viewMode === 'daily') {
    if (selectedDay === 'all') {
      return 'Activity by Hour (All Days)';
    } else {
      const dayIndex = parseInt(selectedDay.replace('day', ''));
      return `Activity by Hour (${data.dayStats[dayIndex].day})`;
    }
  }
  return '';
}

function getHourFromTimeSlot(timeSlot) {
  const parts = timeSlot.split('-');
  return getHourFromTimeString(parts[0]);
}

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

function getColorFromScheme(intensity, scheme = 'blues') {
  switch (scheme) {
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

function showTooltip(svg, x, y, timeSlot, count) {
  // Remove any existing tooltip
  hideTooltip(svg);
  
  // Create tooltip group
  const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "g");
  tooltip.setAttribute("id", "tooltip");
  tooltip.setAttribute("transform", `translate(${x}, ${y})`);
  
  // Background
  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("x", "-80");
  background.setAttribute("y", "-20");
  background.setAttribute("width", "160");
  background.setAttribute("height", "60");
  background.setAttribute("rx", "5");
  background.setAttribute("ry", "5");
  background.setAttribute("fill", "white");
  background.setAttribute("fill-opacity", "0.9");
  background.setAttribute("stroke", "#ccc");
  tooltip.appendChild(background);
  
  // Time slot text
  const slotText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  slotText.setAttribute("x", "0");
  slotText.setAttribute("y", "0");
  slotText.setAttribute("text-anchor", "middle");
  slotText.setAttribute("font-weight", "bold");
  slotText.textContent = timeSlot;
  tooltip.appendChild(slotText);
  
  // Count text
  const countText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  countText.setAttribute("x", "0");
  countText.setAttribute("y", "20");
  countText.setAttribute("text-anchor", "middle");
  countText.textContent = `${count} occurrences`;
  tooltip.appendChild(countText);
  
  // Help text
  const helpText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  helpText.setAttribute("x", "0");
  helpText.setAttribute("y", "35");
  helpText.setAttribute("text-anchor", "middle");
  helpText.setAttribute("font-size", "10");
  helpText.setAttribute("fill", "#666");
  helpText.textContent = "Click for details";
  tooltip.appendChild(helpText);
  
  svg.appendChild(tooltip);
}

function hideTooltip(svg) {
  const tooltip = svg.getElementById("tooltip");
  if (tooltip) {
    svg.removeChild(tooltip);
  }
} p-2 text-left">Statistic</th>
              <th class="border border-gray-300 p-2 text-left">Value</th>
              <th class="border border-gray-300 p-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 p-2">Mean Direction</td>
              <td class="border border-gray-300 p-2">${data.summary.meanDirection.time} (${data.summary.meanDirection.radians.toFixed(2)} radians)</td>
              <td class="border border-gray-300 p-2">Average time of activity</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2">Mean Resultant Length (R)</td>
              <td class="border border-gray-300 p-2">${data.summary.concentration.meanResultantLength.toFixed(4)}</td>
              <td class="border border-gray-300 p-2">Measure of concentration (0-1)</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2">Circular Variance</td>
              <td class="border border-gray-300 p-2">${data.summary.variance.circularVariance.toFixed(4)}</td>
              <td class="border border-gray-300 p-2">Dispersion around the mean</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2">Circular Standard Deviation</td>
              <td class="border border-gray-300 p-2">${data.summary.variance.circularStandardDeviation.hours.toFixed(2)} hours</td>
              <td class="border border-gray-300 p-2">Standard deviation in hours</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2">95% Confidence Interval</td>
              <td class="border border-gray-300 p-2">${data.summary.confidenceInterval.lowerBound} - ${data.summary.confidenceInterval.upperBound}</td>
              <td class="border border-gray-300 p-2">Interval for mean direction</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="mb-4">
        <h4 class="font-medium mb-2">Tests for Circular Uniformity</h4>
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th class="border border-gray-300 p-2 text-left">Test</th>
              <th class="border border-gray-300 p-2 text-left">Statistic</th>
              <th class="border border-gray-300 p-2 text-left">p-value</th>
              <th class="border border-gray-300 p-2 text-left">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 p-2">Rayleigh Test</td>
              <td class="border border-gray-300 p-2">Z = ${data.uniformityTests.rayleigh.zStatistic.toFixed(4)}</td>
              <td class="border border-gray-300 p-2">p = ${data.uniformityTests.rayleigh.pValue.toExponential(4)}</td>
              <td class="border border-gray-300 p-2">${data.uniformityTests.rayleigh.pValue < 0.05 ? "Reject uniformity (p < 0.05)" : "Cannot reject uniformity"}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2">Hodges-Ajne Test</td>
              <td class="border border-gray-300 p-2">m = ${data.uniformityTests.hodgesAjne.mStatistic}</td>
              <td class="border border-gray-300 p-2">ratio = ${data.uniformityTests.hodgesAjne.ratio.toFixed(4)}</td>
              <td class="border border-gray-300 p-2">${data.uniformityTests.hodgesAjne.ratio < 0.75 ? "Suggests non-uniformity" : "Suggests uniformity"}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div>
        <h4 class="font-medium mb-2">Symmetry Analysis</h4>
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th class="border border-gray-300 p-2 text-left">Parameter</th>
              <th class="border border-gray-300 p-2 text-left">Value</th>
              <th class="border border-gray-300 p-2 text-left">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 p-2">Symmetry Ratio</td>
              <td class="border border-gray-300 p-2">${data.summary.symmetry.ratio.toFixed(4)}</td>
              <td class="border border-gray-300 p-2">${Math.abs(data.summary.symmetry.ratio - 1) < 0.2 ? "Approximately symmetric" : "Asymmetric"}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2">Counts Before Mean</td>
              <td class="border border-gray-300 p-2">${data.summary.symmetry.countsBefore}</td>
              <td class="border border-gray-300 p-2" rowspan="2">${data.summary.symmetry.countsAfter > data.summary.symmetry.countsBefore ? "More counts after mean time" : "More counts before mean time"}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2">Counts After Mean</td>
              <td class="border border-gray-300 p-2">${data.summary.symmetry.countsAfter}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="mb-6 bg-white p-4 rounded-lg border border-gray-200">
      <h3 class="text-xl font-semibold mb-3">Peak Activity Analysis</h3>
      
      <div class="mb-4">
        <h4 class="font-medium mb-2">Top 4 Hourly Peaks</h4>
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th class="border border-gray-300
