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
    
    // Repair estimator elements
    const manualRepairInput = document.getElementById('manual-repair-input');
    const estimateRepairInput = document.getElementById('estimate-repair-input');
    const repairTypeSelect = document.getElementById('repair-type-select');
    const estimatedRepairDisplay = document.getElementById('estimated-repair-display');
    const estimatedRepairCostSpan = document.getElementById('estimated-repair-cost');
    
    const form = document.getElementById('calculator-form');
    
    let currentMode = 'manual';
    let currentRepairMode = 'manual-repair';
    let selectedCarData = null;
    let selectedRepairData = null;

    // ========================================
    // TOGGLE BETWEEN MANUAL AND ESTIMATE MODE (CAR VALUE)
    // ========================================
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const mode = this.dataset.mode;
            
            // Handle car value toggle
            if (mode === 'manual' || mode === 'estimate') {
                // Remove active class from car value buttons only
                document.querySelectorAll('[data-mode="manual"], [data-mode="estimate"]').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentMode = mode;
                
                if (currentMode === 'manual') {
                    manualInput.style.display = 'block';
                    estimateInput.style.display = 'none';
                    document.getElementById('car-value').required = true;
                } else {
                    manualInput.style.display = 'none';
                    estimateInput.style.display = 'block';
                    document.getElementById('car-value').required = false;
                    populateYearDropdown();
                }
            }
            
            // Handle repair cost toggle
            if (mode === 'manual-repair' || mode === 'estimate-repair') {
                // Remove active class from repair buttons only
                document.querySelectorAll('[data-mode="manual-repair"], [data-mode="estimate-repair"]').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentRepairMode = mode;
                
                if (currentRepairMode === 'manual-repair') {
                    manualRepairInput.style.display = 'block';
                    estimateRepairInput.style.display = 'none';
                    document.getElementById('repair-cost').required = true;
                } else {
                    manualRepairInput.style.display = 'none';
                    estimateRepairInput.style.display = 'block';
                    document.getElementById('repair-cost').required = false;
                    populateRepairTypeDropdown();
                }
            }
        });
    });

    // ========================================
    // POPULATE YEAR DROPDOWN (2012-2024)
    // ========================================
    function populateYearDropdown() {
        const years = [...new Set(carData.map(car => car.year))].sort((a, b) => b - a);
        carYearSelect.innerHTML = '<option value="">Select year...</option>';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            carYearSelect.appendChild(option);
        });
    }

    // ========================================
    // POPULATE REPAIR TYPE DROPDOWN
    // ========================================
    function populateRepairTypeDropdown() {
        repairTypeSelect.innerHTML = '<option value="">Select repair type...</option>';
        
        // Sort repairs by average cost (highest first) for better UX
        const sortedRepairs = [...repairCosts].sort((a, b) => b.avgCost - a.avgCost);
        
        sortedRepairs.forEach((repair, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${repair.repairType} ($${repair.lowCost.toLocaleString()} - $${repair.highCost.toLocaleString()})`;
            repairTypeSelect.appendChild(option);
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
        
        const makes = [...new Set(
            carData
                .filter(car => car.year === selectedYear)
                .map(car => car.make)
        )].sort();
        
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
        
        const models = [...new Set(
            carData
                .filter(car => car.year === selectedYear && car.make === selectedMake)
                .map(car => car.model)
        )].sort();
        
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
    // REPAIR TYPE SELECTION - SHOW ESTIMATED COST
    // ========================================
    repairTypeSelect.addEventListener('change', function() {
        const selectedIndex = this.value;
        
        if (!selectedIndex) {
            estimatedRepairDisplay.style.display = 'none';
            return;
        }
        
        const sortedRepairs = [...repairCosts].sort((a, b) => b.avgCost - a.avgCost);
        selectedRepairData = sortedRepairs[selectedIndex];
        
        if (selectedRepairData) {
            estimatedRepairCostSpan.textContent = `$${selectedRepairData.lowCost.toLocaleString()} - $${selectedRepairData.highCost.toLocaleString()} (Avg: $${selectedRepairData.avgCost.toLocaleString()})`;
            estimatedRepairDisplay.style.display = 'block';
        }
    });

    // ========================================
    // FORM SUBMISSION - CALCULATE RESULTS
    // ========================================
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get car value
        let carValue;
        let carYear;
        if (currentMode === 'manual') {
            carValue = parseFloat(document.getElementById('car-value').value);
            if (!carValue) {
                alert('Please enter your car\'s value');
                return;
            }
            carYear = null; // Not available in manual mode
        } else {
            if (!selectedCarData) {
                alert('Please select a car from the dropdowns');
                return;
            }
            carValue = selectedCarData.currentValue;
            carYear = selectedCarData.year;
        }
        
        // Get repair cost
        let repairCost;
        if (currentRepairMode === 'manual-repair') {
            repairCost = parseFloat(document.getElementById('repair-cost').value);
            if (!repairCost) {
                alert('Please enter your repair cost');
                return;
            }
        } else {
            if (!selectedRepairData) {
                alert('Please select a repair type');
                return;
            }
            repairCost = selectedRepairData.avgCost;
        }
        
        // Derive car age from selected year when available (used for maintenance estimate)
        const carAge = carYear ? 2026 - carYear : null;

        const keepYears = parseInt(document.getElementById('keep-years').value);
        const userState = document.getElementById('user-state').value;
        const replacementBudgetInput = document.getElementById('replacement-budget').value;
        const replacementBudget = replacementBudgetInput ? parseFloat(replacementBudgetInput) : null;
        const willTradeIn = document.getElementById('trade-in').checked;
        const currentMonthlyPaymentVal = document.getElementById('current-monthly-payment').value;
        const loanMonthsRemainingVal = document.getElementById('loan-months-remaining').value;
        const currentMonthlyPayment = currentMonthlyPaymentVal ? parseFloat(currentMonthlyPaymentVal) : 0;
        const loanMonthsRemaining = loanMonthsRemainingVal ? parseInt(loanMonthsRemainingVal) : 0;

        const results = calculateRepairVsReplace({
            carValue,
            carAge,
            repairCost,
            keepYears,
            userState,
            replacementBudget,
            willTradeIn,
            currentMonthlyPayment,
            loanMonthsRemaining,
            yearlyDropPercent: selectedCarData ? selectedCarData.yearlyDropPercent : 9
        });
        
        displayResults(results);
    });

    // ========================================
    // CALCULATION LOGIC
    // ========================================
    function calculateRepairVsReplace(inputs) {
        const { carValue, carAge, repairCost, keepYears, userState, replacementBudget, willTradeIn, yearlyDropPercent, currentMonthlyPayment, loanMonthsRemaining } = inputs;
        
        const stateInsurance = insuranceCosts.find(s => s.state === userState) || { avgAnnualPremium: 1500 };
        
        const loanPaymentsDuringKeep = Math.min(loanMonthsRemaining, keepYears * 12) * currentMonthlyPayment;

        const repairOption = {
            upfrontCost: repairCost,
            yearlyInsurance: stateInsurance.avgAnnualPremium,
            yearlyMaintenance: estimateMaintenance(carAge),
            loanPaymentsDuringKeep: loanPaymentsDuringKeep,
            depreciation: yearlyDropPercent / 100,
            futureValue: carValue * Math.pow(1 - (yearlyDropPercent / 100), keepYears),
            totalCost: 0
        };

        repairOption.totalCost = repairCost +
            (repairOption.yearlyInsurance + repairOption.yearlyMaintenance) * keepYears +
            loanPaymentsDuringKeep;
        
        const replacementCarValue = replacementBudget || (carValue * 1.3);
        const standardDownPayment = replacementCarValue * 0.2;  // 20% down
        let tradeInCredit = 0;
        let cashDownPaymentNeeded = standardDownPayment;
        let loanAmount = 0;
        
        if (willTradeIn) {
            tradeInCredit = carValue;
            // Trade-in can cover some or all of the down payment
            cashDownPaymentNeeded = Math.max(0, standardDownPayment - tradeInCredit);
            
            // What's left after trade-in?
            const remainingAfterTradeIn = replacementCarValue - tradeInCredit;
            
            // Loan is what's left after trade-in minus any additional cash down
            loanAmount = Math.max(0, remainingAfterTradeIn - cashDownPaymentNeeded);
        } else {
            // No trade-in: standard 20% down, finance the rest
            loanAmount = replacementCarValue - standardDownPayment;
        }
        
        const monthlyPayment = loanAmount > 0 ? calculateMonthlyPayment(loanAmount, 0.07, keepYears) : 0;
        
        const replaceOption = {
            replacementCarValue: replacementCarValue,
            tradeInCredit: tradeInCredit,
            downPayment: cashDownPaymentNeeded,
            loanAmount: loanAmount,
            monthlyPayment: monthlyPayment,
            yearlyInsurance: stateInsurance.avgAnnualPremium,
            yearlyMaintenance: 500,
            totalCost: 0
        };
        
        replaceOption.totalCost = cashDownPaymentNeeded + 
            (monthlyPayment * 12 * keepYears) + 
            (replaceOption.yearlyInsurance + replaceOption.yearlyMaintenance) * keepYears;
        
        const repairToValueRatio = repairCost / carValue;
        let recommendation;
        let savings;
        
        // Determine which option is cheaper
        if (repairOption.totalCost < replaceOption.totalCost) {
            recommendation = 'REPAIR';
            savings = replaceOption.totalCost - repairOption.totalCost;
        } else {
            recommendation = 'REPLACE';
            savings = repairOption.totalCost - replaceOption.totalCost;
        }
        
        // Add warning note if repair-to-value ratio is high (even if repair is cheaper)
        const hasHighRatio = repairToValueRatio > 0.5;

        return {
            recommendation,
            savings: Math.abs(savings),
            repairOption,
            replaceOption,
            repairToValueRatio,
            hasHighRatio
        };
    }

    function estimateMaintenance(carAge) {
        if (!carAge || carAge <= 8) return 800;
        if (carAge <= 12) return 1200;
        return 1500;
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
        
        // Build warning message if applicable
        let warningMessage = '';
        if (results.recommendation === 'REPAIR' && results.hasHighRatio) {
            warningMessage = `
                <div class="warning-box">
                    <strong>⚠️ Note:</strong> While repairing is cheaper overall, the repair cost is ${(results.repairToValueRatio * 100).toFixed(0)}% of your car's value. 
                    Many experts recommend replacing when repair costs exceed 50% of value. Consider whether this repair might be followed by others soon.
                </div>
            `;
        }
        
        const html = `
            <h2>Your Results</h2>
            
            <div class="recommendation ${results.recommendation.toLowerCase()}">
                <h3>💡 Recommendation: ${results.recommendation}</h3>
                <p>You could save approximately <strong>$${Math.round(results.savings).toLocaleString()}</strong> 
                over ${parseInt(document.getElementById('keep-years').value, 10) || 0} years</p>
            </div>
            
            ${warningMessage}
            
            <div class="comparison">
                <div class="option repair-option">
                    <h3>🔧 Repair & Keep</h3>
                    <div class="cost-breakdown">
                        <p><strong>Upfront:</strong> $${results.repairOption.upfrontCost.toLocaleString()}</p>
                        ${results.repairOption.loanPaymentsDuringKeep > 0 ? `<p><strong>Remaining Loan Payments:</strong> $${Math.round(results.repairOption.loanPaymentsDuringKeep).toLocaleString()}</p>` : ''}
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
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

});
