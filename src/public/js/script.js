
$(document).ready(() => {
    // Define constants for MAXP, toValidate inputs, RadioValid elements, and launchTestButton.
    const MAXP = $("#MAXP");
    const toValidate = $('#MAXT, #MAXR, #MAXN');
    const RadioValid = $('#scenario1, #scenario2');
    const launchTestButton = $("#launch-test");

    // Initialize variables for validation.
    let valid = false;
    let valid1 = false;
    let valid2 = false;
    let valid4 = false;

    // Initialize arrays for storing checked checkboxes.
    const Jointnames = [];
    const Reconames = [];

    // This function updates the validations based on the current state of the form inputs.
    function updateValidations() {
        valid = valid1 && valid2 && valid4;
        launchTestButton.prop('disabled', !valid);
    }

    // This function updates the array Reconames with the ids of the checked checkboxes in the .recos group.
    function updateReconames() {
        Reconames.length = 0;
        $('.recos input:checked').each(function () {
            Reconames.push(this.id);
        });
    }

    // This function updates the array Jointnames with the ids of the checked checkboxes in the .joint group.
    function updateJointnames() {
        Jointnames.length = 0;
        $('.joint input:checked').each(function () {
            Jointnames.push(this.id);
        });
    }

    // Event listener for the change event on the #EvalTool element.
    // Calls the updateReconames and updateJointnames functions and updates the valid1 variable.
    $('#EvalTool').on("change", function () {
        updateReconames();
        updateJointnames();
        valid1 = Reconames.length > 0 && Jointnames.length > 0;
        updateValidations();
    });

    // Event listener for the keyup event on the toValidate elements.
    // Checks if all the toValidate inputs are numeric and greater than 0.
    // Updates the valid2 variable.
    toValidate.keyup(function () {
        valid2 = toValidate.toArray().every(input => $.isNumeric($(input).val()) && $(input).val() > 0);
        updateValidations();
    });

    // Event listener for the click event on the RadioValid elements.
    // Updates the valid4 variable based on the selected value.
    // Disables the MAXP input if the value is not "1".
    RadioValid.click(function () {
        valid4 = $(this).val() !== "1";
        MAXP.prop('disabled', valid4);
        updateValidations();
    });

    // Event listener for the keyup event on the MAXP input.
    // Checks if the MAXP input is numeric and greater than 0.
    // Updates the valid4 variable.
    MAXP.keyup(function () {
        valid4 = $.isNumeric($(this).val()) && $(this).val() > 0;
        updateValidations();
    });
});
