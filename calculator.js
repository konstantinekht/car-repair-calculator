// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    
    // Get elements
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const manualInput = document.getElementById('manual-input');
    const estimateInput = document.getElementById('estimate-input');
    const carYearSelect = document.getElementById('car-year');
    const carMakeSelect = document.getElementById('car-make');
    const carModelSelect = document.getElementById('car-model');
    const estimatedValueDisplay = document.getElementById('estimated-value-display');
    const estimatedValueSpan = document.getElementById('estimated-value');
    const form = document.getElementById('calculator-form');
    
    let currentMode = 'manual';
    let selectedCarData = null;

    // ========================================
    // TOGGLE BETWEEN MANUAL AND ESTIMATE MODE
    // ========================================
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get the mode
            currentMode = this.dataset.mode;
            
            // Show/hide appropriate sections
            if (currentMode === 'manual') {
                manualInput.style.display = 'block';
                estimateInput.style.display = 'none';
                // Make manual input required
                document.getElementById('car-value').required = true;
            } else {
                manualInput.style.display = 'none';
                estimateInput.style.display = 'block';
                // Make manual input not required
                document.getElementById('car-value').required = false;
                // Populate year dropdown
                populateYearDropdown();
            }
        });
    });

    // ========================================
    // POPULATE YEAR DROPDOWN
    // ========================================
    function populateYearDropdown() {
        // Get unique years from carData
        const years = [...new Set(carData.map(car => car.year))].sort((a, b) => b - a);
        
        // Clear existing options
        carYearSelect.innerHTML = '<option value="">Select year...</option>';
        
        // Add year options
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            carYearSelect.appendChild(option);
        });
    }

    // ========================================
    // YEAR SELECTION - POPULATE MAKES
    // ========================================
    carYearSelect.addEventListener('change', function() {
        const selectedYear = parseInt(this.value);
        
        if (!selectedYear) {
            carMakeSelect.disabled = true;
            carMakeSelect.innerHTML = '<option value="">Select year first...</option>';
            carModelSelect.disabled = true;
            carModelSelect.innerHTML = '<option value="">Select make first...</option>';
            estimatedValueDisplay.style.display = 'none';
            return;
        }
        
        // Get unique makes for selected year
        const makes = [...new Set(
            carData
                .filter(car => car.year === selectedYear)
                .map(car => car.make)
        )].sort();
        
        // Populate make dropdown
        carMakeSelect.innerHTML = '<option value="">Select make...</option>';
        makes.forEach(make => {
            const option = document.createElement('option');
            option.value = make;
            option.textContent = make;
            carMakeSelect.appendChild(option);
        });
        
        carMakeSelect.disabled = false;
        carModelSelect.disabled = true;
        carModelSelect.innerHTML = '<option value="">Select make first...</option>';
        estimatedValueDisplay.style.display = 'none';
    });

    // ========================================
    // MAKE SELECTION - POPULATE MODELS
    // ========================================
    carMakeSelect.addEventListener('change', function() {
        const selectedYear = parseInt(carYearSelect.value);
        const selectedMake = this.value;
        
        if (!selectedMake) {
            carModelSelect.disabled = true;
            carModelSelect.innerHTML = '<option value="">Select make first...</option>';
            estimatedValueDisplay.style.display = 'none';
            return;
        }
        
        // Get unique models for selected year and make
        const models = [...new Set(
            carData
                .filter(car => car.year === selectedYear && car.make === selectedMake)
                .map(car => car.model)
        )].sort();
        
        // Populate model dropdown
        carModelSelect.innerHTML = '<option value="">Select model...</option>';
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            carModelSelect.appendChild(option);
        });
        
        carModelSelect.disabled = false;
        estimatedValueDisplay.style.display = 'none';
    });

    // ========================================
    // MODEL SELECTION - SHOW ESTIMATED VALUE
    // ========================================
    carModelSelect.addEventListener('change', function() {
        const selectedYear = parseInt(carYearSelect.value);
        const selectedMake = carMakeSelect.value;
        const selectedModel = this.value;
        
        if (!selectedModel) {
            estimatedValueDisplay.style.display = 'none';
            return;
        }
        
        // Find the car data
        selectedCarData = carData.find(car => 
            car.year === selectedYear && 
            car.make === selectedMake && 
            car.model === selectedModel
        );
        
        if (selectedCarData) {
            estimatedValueSpan.textContent = '$' + selectedCarData.currentValue.toLocaleString();
            estimatedValueDisplay.style.display = 'block';
        }
    });

    // ========================================
    // FORM SUBMISSION - CALCULATE RESULTS
    // ========================================
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        let carValue;
        if (currentMode === 'manual') {
            carValue = parseFloat(document.getElementById('car-value').value);
        } else {
            if (!selectedCarData) {
                alert('Please select a car from the dropdowns');
                return;
            }
            carValue = selectedCarData.currentValue;
        }
        
            const mileage = parseInt(document.getElementById('mileage').value);
            const carAge = parseInt(document.getElementById('car-age').value);
            const repairCost = parseFloat(document.getElementById('repair-cost').value);
            const keepYears = parseInt(document.getElementById('keep-years').value);
            const userState = document.getElementById('user-state').value;

            // NEW: Get replacement budget and trade-in preference
            const replacementBudgetInput = document.getElementById('replacement-budget').value;
            const replacementBudget = replacementBudgetInput ? parseFloat(replacementBudgetInput) : null;
            const willTradeIn = document.getElementById('trade-in').checked;

            // Calculate and show results
            const results = calculateRepairVsReplace({
                carValue,
                mileage,
                carAge,
                repairCost,
                keepYears,
                userState,
                replacementBudget,
                willTradeIn,
                yearlyDropPercent: selectedCarData ? selectedCarData.yearlyDropPercent : 9
            });
        
        displayResults(results);
    });

    // ========================================
    // CALCULATION LOGIC
    // ========================================
function calculateRepairVsReplace(inputs) {
    const { carValue, mileage, carAge, repairCost, keepYears, userState, replacementBudget, willTradeIn, yearlyDropPercent } = inputs;
    
    // Look up insurance cost for selected state
    const stateInsurance = insuranceCosts.find(s => s.state === userState) || { avgAnnualPremium: 1500 };
    
    // Calculate REPAIR option
    const repairOption = {
        upfrontCost: repairCost,
        yearlyInsurance: stateInsurance.avgAnnualPremium,  // SAME insurance for both
        yearlyMaintenance: estimateMaintenance(mileage, carAge),
        depreciation: yearlyDropPercent / 100,
        futureValue: carValue * Math.pow(1 - (yearlyDropPercent / 100), keepYears),
        totalCost: 0
    };
    
    // Total cost to repair and keep
    repairOption.totalCost = repairCost + 
        (repairOption.yearlyInsurance + repairOption.yearlyMaintenance) * keepYears;
    
    // Calculate REPLACE option
    // Use user's budget if provided, otherwise estimate 1.3x current value
    const replacementCarValue = replacementBudget || (carValue * 1.3);
    
    // Calculate down payment needed
    let downPaymentNeeded = replacementCarValue * 0.2; // 20% down
    
    // If trading in, subtract current car value from down payment
    let tradeInCredit = 0;
    if (willTradeIn) {
        tradeInCredit = carValue;
        downPaymentNeeded = Math.max(0, downPaymentNeeded - tradeInCredit); // Can't be negative
    }
    
    // Loan amount is replacement price minus down payment minus trade-in
    const totalUpfront = willTradeIn ? (replacementCarValue * 0.2) : downPaymentNeeded;
    const loanAmount = replacementCarValue - totalUpfront - (willTradeIn ? tradeInCredit : 0);
    const monthlyPayment = loanAmount > 0 ? calculateMonthlyPayment(loanAmount, 0.07, keepYears) : 0;
    
    const replaceOption = {
        replacementCarValue: replacementCarValue,
        tradeInCredit: tradeInCredit,
        downPayment: downPaymentNeeded,
        loanAmount: loanAmount,
        monthlyPayment: monthlyPayment,
        yearlyInsurance: stateInsurance.avgAnnualPremium, // SAME as repair option
        yearlyMaintenance: 500, // Lower maintenance on newer car
        totalCost: 0
    };
    
    // Total cost to replace
    replaceOption.totalCost = downPaymentNeeded + 
        (monthlyPayment * 12 * keepYears) + 
        (replaceOption.yearlyInsurance + replaceOption.yearlyMaintenance) * keepYears;        
        // Determine recommendation
        const repairToValueRatio = repairCost / carValue;
        let recommendation;
        let savings;
        
        if (repairToValueRatio > 0.5 || mileage > 150000) {
            recommendation = 'REPLACE';
            savings = repairOption.totalCost - replaceOption.totalCost;
        } else if (repairOption.totalCost < replaceOption.totalCost) {
            recommendation = 'REPAIR';
            savings = replaceOption.totalCost - repairOption.totalCost;
        } else {
            recommendation = 'REPLACE';
            savings = repairOption.totalCost - replaceOption.totalCost;
        }
        
        return {
            recommendation,
            savings: Math.abs(savings),
            repairOption,
            replaceOption,
            repairToValueRatio
        };
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================
    function estimateMaintenance(mileage, age) {
        // Higher mileage/age = higher maintenance
        if (mileage > 150000 || age > 12) return 1500;
        if (mileage > 100000 || age > 8) return 1200;
        return 800;
    }

    function calculateMonthlyPayment(principal, annualRate, years) {
        const monthlyRate = annualRate / 12;
        const numPayments = years * 12;
        return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
               (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    // ========================================
// DISPLAY RESULTS
// ========================================
function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    
    const html = `
        <h2>Your Results</h2>
        
        <div class="recommendation ${results.recommendation.toLowerCase()}">
            <h3>💡 Recommendation: ${results.recommendation}</h3>
            <p>You could save approximately <strong>$${Math.round(results.savings).toLocaleString()}</strong> 
            over ${document.getElementById('keep-years').value} years</p>
        </div>
        
        <div class="comparison">
            <div class="option repair-option">
                <h3>🔧 Repair & Keep</h3>
                <div class="cost-breakdown">
                    <p><strong>Upfront:</strong> $${results.repairOption.upfrontCost.toLocaleString()}</p>
                    <p><strong>Yearly Insurance:</strong> $${results.repairOption.yearlyInsurance.toLocaleString()}</p>
                    <p><strong>Yearly Maintenance:</strong> $${results.repairOption.yearlyMaintenance.toLocaleString()}</p>
                    <p class="total"><strong>Total Cost:</strong> $${Math.round(results.repairOption.totalCost).toLocaleString()}</p>
                </div>
            </div>
            
            <div class="option replace-option">
                <h3>🚗 Replace</h3>
                <div class="cost-breakdown">
                    <p><strong>Replacement Car:</strong> $${results.replaceOption.replacementCarValue.toLocaleString()}</p>
                    ${results.replaceOption.tradeInCredit > 0 ? 
                        `<p><strong>Trade-In Credit:</strong> -$${results.replaceOption.tradeInCredit.toLocaleString()}</p>` : ''}
                    <p><strong>Down Payment Needed:</strong> $${results.replaceOption.downPayment.toLocaleString()}</p>
                    ${results.replaceOption.monthlyPayment > 0 ? 
                        `<p><strong>Monthly Payment:</strong> $${Math.round(results.replaceOption.monthlyPayment).toLocaleString()}</p>` : 
                        `<p><strong>Monthly Payment:</strong> $0 (paid in full)</p>`}
                    <p><strong>Yearly Insurance:</strong> $${results.replaceOption.yearlyInsurance.toLocaleString()}</p>
                    <p><strong>Yearly Maintenance:</strong> $${results.replaceOption.yearlyMaintenance.toLocaleString()}</p>
                    <p class="total"><strong>Total Cost:</strong> $${Math.round(results.replaceOption.totalCost).toLocaleString()}</p>
                </div>
            </div>
        </div>
        
        <div class="disclaimer">
            <p><small>⚠️ This is an estimate based on average costs. Your actual costs may vary. 
            Repair-to-value ratio: ${(results.repairToValueRatio * 100).toFixed(1)}%</small></p>
        </div>
    `;
    
    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
});