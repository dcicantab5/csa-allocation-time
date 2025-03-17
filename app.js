document.addEventListener('DOMContentLoaded', async function() {
    // DOM elements
    const roseChart = document.getElementById('rose-chart');
    const chartTitle = document.getElementById('chart-title');
    const daySelect = document.getElementById('day-select');
    const colorScheme = document.getElementById('color-scheme');
    const toggleLabelsBtn = document.getElementById('toggle-labels');
    const hourlyBtn = document.querySelector('.hourly-btn');
    const blocksBtn = document.querySelector('.blocks-btn');
    const byDayBtn = document.querySelector('.byday-btn');
    const daySelector = document.querySelector('.day-selector');

    // State variables
    let data;
    let chart;
    let currentView = 'hourly';
    let selectedDay = 'all';
    let labelVisibility = true;
    let currentColorScheme = 'blues';

    // Color schemes
    const colorSchemes = {
        blues: {
            background: [
                'rgba(65, 105, 225, 0.6)',
                'rgba(65, 105, 225, 0.7)',
                'rgba(65, 105, 225, 0.8)',
                'rgba(65, 105, 225, 0.9)'
            ],
            border: [
                'rgba(65, 105, 225, 0.8)',
                'rgba(65, 105, 225, 0.85)',
                'rgba(65, 105, 225, 0.9)',
                'rgba(65, 105, 225, 1)'
            ]
        },
        greens: {
            background: [
                'rgba(46, 139, 87, 0.6)',
                'rgba(46, 139, 87, 0.7)',
                'rgba(46, 139, 87, 0.8)',
                'rgba(46, 139, 87, 0.9)'
            ],
            border: [
                'rgba(46, 139, 87, 0.8)',
                'rgba(46, 139, 87, 0.85)',
                'rgba(46, 139, 87, 0.9)',
                'rgba(46, 139, 87, 1)'
            ]
        },
        purples: {
            background: [
                'rgba(128, 0, 128, 0.6)',
                'rgba(128, 0, 128, 0.7)',
                'rgba(128, 0, 128, 0.8)',
                'rgba(128, 0, 128, 0.9)'
            ],
            border: [
                'rgba(128, 0, 128, 0.8)',
                'rgba(128, 0, 128, 0.85)',
                'rgba(128, 0, 128, 0.9)',
                'rgba(128, 0, 128, 1)'
            ]
        },
        reds: {
            background: [
                'rgba(220, 20, 60, 0.6)',
                'rgba(220, 20, 60, 0.7)',
                'rgba(220, 20, 60, 0.8)',
                'rgba(220, 20, 60, 0.9)'
            ],
            border: [
                'rgba(220, 20, 60, 0.8)',
                'rgba(220, 20, 60, 0.85)',
                'rgba(220, 20, 60, 0.9)',
                'rgba(220, 20, 60, 1)'
            ]
        }
    };

    // Fetch data
    try {
        const response = await fetch('circular-stats-data.json');
        data = await response.json();
        console.log('Data loaded:', data);
        
        // Populate day selector
        populateDaySelect();
        
        // Initialize the chart
        initializeChart();
        updateChart();
        
        // Set initial active button
        hourlyBtn.classList.add('active');
    } catch (error) {
        console.error('Error loading data:', error);
    }

    // Event listeners
    hourlyBtn.addEventListener('click', () => changeView('hourly'));
    blocksBtn.addEventListener('click', () => changeView('blocks'));
    byDayBtn.addEventListener('click', () => changeView('byday'));
    daySelect.addEventListener('change', (e) => {
        selectedDay = e.target.value;
        updateChart();
    });
    colorScheme.addEventListener('change', (e) => {
        currentColorScheme = e.target.value;
        updateChart();
    });
    toggleLabelsBtn.addEventListener('click', toggleLabels);

    // Helper functions
    function populateDaySelect() {
        // Clear any existing options except the first one
        while (daySelect.options.length > 1) {
            daySelect.remove(1);
        }
        
        // Add day options
        data.dayStats.forEach(day => {
            const option = document.createElement('option');
            option.value = day.day;
            option.textContent = day.day;
            daySelect.appendChild(option);
        });
    }
    
    function changeView(view) {
        currentView = view;
        
        // Update UI
        hourlyBtn.classList.remove('active');
        blocksBtn.classList.remove('active');
        byDayBtn.classList.remove('active');
        
        switch(view) {
            case 'hourly':
                hourlyBtn.classList.add('active');
                daySelector.style.display = 'none';
                chartTitle.textContent = 'Overall Activity by Hour';
                break;
            case 'blocks':
                blocksBtn.classList.add('active');
                daySelector.style.display = 'none';
                chartTitle.textContent = 'Activity by 4-Hour Blocks';
                break;
            case 'byday':
                byDayBtn.classList.add('active');
                daySelector.style.display = 'block';
                chartTitle.textContent = `Activity by Hour ${selectedDay === 'all' ? '(All Days)' : '(' + selectedDay + ')'}`;
                break;
        }
        
        updateChart();
    }
    
    function toggleLabels() {
        labelVisibility = !labelVisibility;
        toggleLabelsBtn.textContent = labelVisibility ? 'Hide Labels' : 'Show Labels';
        updateChart();
    }
    
    function getChartData() {
        let labels = [];
        let values = [];
        let backgroundColor = [];
        let borderColor = [];
        
        const colors = colorSchemes[currentColorScheme];
        
        switch(currentView) {
            case 'hourly':
                // For hourly view, we use the hourlyDistribution
                data.hourlyDistribution.forEach(slot => {
                    labels.push(slot.timeSlot);
                    values.push(slot.count);
                    
                    // Special coloring for peak hours
                    if (slot.count >= 40) {
                        backgroundColor.push(colors.background[3]);
                        borderColor.push(colors.border[3]);
                    } else if (slot.count >= 30) {
                        backgroundColor.push(colors.background[2]);
                        borderColor.push(colors.border[2]);
                    } else if (slot.count >= 20) {
                        backgroundColor.push(colors.background[1]);
                        borderColor.push(colors.border[1]);
                    } else {
                        backgroundColor.push(colors.background[0]);
                        borderColor.push(colors.border[0]);
                    }
                });
                break;
                
            case 'blocks':
                // For blocks view, we use the timeBlocks
                data.timeBlocks.forEach(block => {
                    labels.push(block.timeBlock);
                    values.push(block.count);
                    
                    // Color based on count
                    if (block.count >= 100) {
                        backgroundColor.push(colors.background[3]);
                        borderColor.push(colors.border[3]);
                    } else if (block.count >= 90) {
                        backgroundColor.push(colors.background[2]);
                        borderColor.push(colors.border[2]);
                    } else if (block.count >= 80) {
                        backgroundColor.push(colors.background[1]);
                        borderColor.push(colors.border[1]);
                    } else {
                        backgroundColor.push(colors.background[0]);
                        borderColor.push(colors.border[0]);
                    }
                });
                break;
                
            case 'byday':
                // For by-day view, we use the hourly breakdown of the selected day
                if (selectedDay === 'all') {
                    // Use hourlyDistribution for "All Days"
                    data.hourlyDistribution.forEach(slot => {
                        labels.push(slot.timeSlot);
                        values.push(slot.count);
                        
                        if (slot.count >= 40) {
                            backgroundColor.push(colors.background[3]);
                            borderColor.push(colors.border[3]);
                        } else if (slot.count >= 30) {
                            backgroundColor.push(colors.background[2]);
                            borderColor.push(colors.border[2]);
                        } else if (slot.count >= 20) {
                            backgroundColor.push(colors.background[1]);
                            borderColor.push(colors.border[1]);
                        } else {
                            backgroundColor.push(colors.background[0]);
                            borderColor.push(colors.border[0]);
                        }
                    });
                } else {
                    // Get hourly breakdown for the selected day
                    const dayData = data.dayStats.find(day => day.day === selectedDay);
                    
                    if (dayData) {
                        dayData.hourlyBreakdown.forEach(slot => {
                            labels.push(slot.timeSlot);
                            values.push(slot.count);
                            
                            if (slot.count >= 10) {
                                backgroundColor.push(colors.background[3]);
                                borderColor.push(colors.border[3]);
                            } else if (slot.count >= 7) {
                                backgroundColor.push(colors.background[2]);
                                borderColor.push(colors.border[2]);
                            } else if (slot.count >= 3) {
                                backgroundColor.push(colors.background[1]);
                                borderColor.push(colors.border[1]);
                            } else {
                                backgroundColor.push(colors.background[0]);
                                borderColor.push(colors.border[0]);
                            }
                        });
                        
                        // Update chart title with the mean time for the day
                        chartTitle.textContent = `Activity by Hour (${selectedDay}, Mean: ${dayData.meanTime})`;
                    }
                }
                break;
        }
        
        return {
            labels,
            values,
            backgroundColor,
            borderColor
        };
    }
    
    function formatLabels(labels) {
        if (currentView === 'hourly' || currentView === 'byday') {
            return labels.map(label => {
                // Extract just the hour part for display
                const parts = label.split('-');
                return parts[0];
            });
        }
        return labels;
    }
    
    function initializeChart() {
        const ctx = roseChart.getContext('2d');
        
        Chart.defaults.font.family = "'Segoe UI', 'Helvetica Neue', 'Arial', sans-serif";
        Chart.defaults.font.size = 12;
        
        chart = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)',
                        },
                        grid: {
                            circular: true,
                            color: 'rgba(0, 0, 0, 0.1)',
                        },
                        ticks: {
                            display: false
                        },
                        pointLabels: {
                            display: true,
                            centerPointLabels: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Count: ${context.raw}`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 500
                }
            }
        });
    }
    
    function updateChart() {
        const chartData = getChartData();
        
        chart.data.labels = formatLabels(chartData.labels);
        chart.data.datasets[0].data = chartData.values;
        chart.data.datasets[0].backgroundColor = chartData.backgroundColor;
        chart.data.datasets[0].borderColor = chartData.borderColor;
        
        // Update the pointLabels display based on user preference
        chart.options.scales.r.pointLabels.display = labelVisibility;
        
        // Draw mean direction indicator if available
        drawMeanDirection();
        
        chart.update();
    }
    
    function drawMeanDirection() {
        if ((currentView === 'hourly' || (currentView === 'byday' && selectedDay === 'all')) && chart) {
            // Calculate center and radius for the chart
            const canvas = roseChart;
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const centerX = width / 2;
            const centerY = height / 2;
            
            // Get the chart's radius (approximate based on canvas dimensions)
            const radius = Math.min(centerX, centerY) * 0.8;
            
            // Remove any existing mean direction indicator
            const existingIndicator = document.getElementById('mean-direction-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Get the mean direction in radians
            let angle = data.summary.meanDirection.radians;
            
            // Adjust for Chart.js's polar coordinate system (0 at top, clockwise)
            // Convert to degrees and adjust
            let degrees = (angle * 180 / Math.PI) - 90;
            
            // Create a new element for the indicator
            const indicator = document.createElement('div');
            indicator.id = 'mean-direction-indicator';
            indicator.style.position = 'absolute';
            indicator.style.left = `${centerX}px`;
            indicator.style.top = `${centerY}px`;
            indicator.style.width = `${radius}px`;
            indicator.style.height = '2px';
            indicator.style.backgroundColor = '#ff5555';
            indicator.style.transformOrigin = '0% 50%';
            indicator.style.transform = `rotate(${degrees}deg)`;
            indicator.style.zIndex = '10';
            
            // Create the arrow point
            const arrow = document.createElement('div');
            arrow.style.position = 'absolute';
            arrow.style.right = '0';
            arrow.style.top = '-4px';
            arrow.style.width = '10px';
            arrow.style.height = '10px';
            arrow.style.borderRadius = '50%';
            arrow.style.backgroundColor = '#ff5555';
            
            // Create the label
            const label = document.createElement('div');
            label.style.position = 'absolute';
            label.style.right = '-40px';
            label.style.top = '-20px';
            label.style.color = '#ff5555';
            label.style.fontSize = '12px';
            label.style.fontWeight = 'bold';
            label.textContent = data.summary.meanDirection.time;
            
            // Add everything to the chart container
            indicator.appendChild(arrow);
            indicator.appendChild(label);
            
            const chartContainer = document.querySelector('.chart-container');
            chartContainer.style.position = 'relative';
            chartContainer.appendChild(indicator);
        }
    }
});
