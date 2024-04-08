// Event listener for when the DOM content has been loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get the form element with the id 'EvalTool'
    const form = document.getElementById('EvalTool');
    
    // Add an event listener for when the form is submitted
    form.addEventListener('submit', (e) => {
        // Get the button element with the id 'launch-test'
        const button = document.getElementById('launch-test');
        
        // Update the button value to "started" and disable it
        button.value = "started";
        button.disabled = true;
        
        // Get all the form elements
        const elements = form.elements;
        
        // Loop through each form element
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            // Check if the element is an input or select element
            if (element.localName === "input" || element.localName === "select") {
                // Set the element to read-only
                element.readOnly = true;
            }
        }
    });
});

// Function to reset the form
function resetForm() {
    // Get the button element with the id 'launch-test'
    const button = document.getElementById('launch-test');
    
    // Check if the button value is not "started"
    if (button.value !== "started") {
        // Reset the form with the id 'EvalTool'
        document.getElementById('EvalTool').reset();
        
        // Disable the button using jQuery
        jQuery("#launch-test").prop('disabled', true);
    }
}
