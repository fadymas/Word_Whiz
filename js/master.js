// === Constants and State ===
const inputsContainer = document.querySelector(".main__inputs");
const checkButton = document.querySelector(".buttons__check");
const hintButton = document.querySelector(".buttons__hint");

const NUMBER_OF_TRIES = 5;
const NUMBER_OF_LETTERS = 6;

let currentTry = 1;
let targetWord = "";
let hintCount = 3;

// === 1. Fetch the word from API with error handling ===
async function fetchRandomWord() {
    try {
        const response = await fetch("https://random-word-api.vercel.app/api?words=1&length=6&type=uppercase");
        const data = await response.json();
        if (!data[0]) throw new Error("No word returned");
        return data[0].toUpperCase(); // Convert to uppercase once for consistency
    } catch (error) {
        window.reload()
        console.error(error);
    }
}

// === 2. Generate all attempts (rows of inputs) ===
function generateTries() {
    for (let i = 1; i <= NUMBER_OF_TRIES; i++) {
        const tryRow = document.createElement("div");
        tryRow.classList.add(`try-${i}`, "d-flex", "justify-content-between", "align-items-center", "mb-2");
        if (i !== 1) tryRow.classList.add("disabled-try");

        const label = document.createElement("span");
        label.classList.add("roboto-bold");
        label.textContent = `Try ${i}`;
        tryRow.appendChild(label);

        generateLetterInputs(tryRow, i);
        inputsContainer.appendChild(tryRow);
    }

    // Focus on the first input of the first try
    inputsContainer.querySelector(".try-1 input").focus();
}

// === 3. Generate letter input fields for a single try ===
function generateLetterInputs(container, tryNumber) {
    for (let j = 0; j < NUMBER_OF_LETTERS; j++) {
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 1;
        input.id = `guess-${tryNumber}-letter-${j}`;
        input.classList.add("roboto-medium", "rounded-1");

        if (tryNumber !== 1) input.disabled = true;

        // Handle input: auto uppercase and move to next
        input.addEventListener("input", (e) => {
            if (!e.data) return;
            input.value = input.value.toUpperCase();
            if (input.nextElementSibling) input.nextElementSibling.focus();

        });

        // Handle keyboard navigation: arrows + backspace
        input.addEventListener("keydown", (e) => {
            const allInputs = Array.from(inputsContainer.querySelectorAll("input:not([disabled])"));
            const currentIndex = allInputs.indexOf(e.target);

            switch (e.key) {
                case "ArrowRight":
                    if (currentIndex < allInputs.length - 1) {
                        allInputs[currentIndex + 1].focus();
                    }
                    break;

                case "ArrowLeft":
                    if (currentIndex > 0) {
                        allInputs[currentIndex - 1].focus();
                        setTimeout(() => {
                            const prevInput = allInputs[currentIndex - 1];
                            prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
                        }, 0);
                    }
                    break;

                case "Backspace":
                    // If current input is empty, go back and clear previous one
                    if (e.target.value === "" && currentIndex > 0) {
                        const prevInput = allInputs[currentIndex - 1];
                        prevInput.value = "";
                        prevInput.focus();
                    }
                    break;
            }
        });


        container.appendChild(input);
    }
}

// === 4. Enable or disable all inputs of a specific try ===
function toggleTryInputs(tryNumber, enable) {
    const tryRow = document.querySelector(`.try-${tryNumber}`);
    tryRow.classList.toggle("disabled-try", !enable);
    tryRow.querySelectorAll("input").forEach(input => input.disabled = !enable);
}


// === 5. Logic to check user guess against the correct word ===
function checkGuess(userInputs, correctWord) {
    // 1. Build frequency map of correctWord
    const countLetters = new Map();

    for (const char of correctWord) {
        countLetters.set(char, (countLetters.get(char) || 0) + 1);
    }

    const result = new Array(userInputs.length).fill("no");

    // 2. First pass: check exact matches
    for (let i = 0; i < userInputs.length; i++) {
        const guessChar = userInputs[i];
        const correctChar = correctWord[i];

        if (guessChar === correctChar) {
            result[i] = "yes-in-place";
            countLetters.set(guessChar, countLetters.get(guessChar) - 1);
        }
    }

    // 3. Second pass: check wrong-place matches
    for (let i = 0; i < userInputs.length; i++) {
        const guessChar = userInputs[i];

        // Skip already matched
        if (result[i] !== "no") continue;

        if (countLetters.get(guessChar) > 0) {
            result[i] = "not-in-place";
            countLetters.set(guessChar, countLetters.get(guessChar) - 1);
        }
    }

    return result;
}


// === 6. The end message ===
function showEndMessage(text, color) {
    const message = document.querySelector(".message");
    message.innerHTML = `${text}<span>${targetWord}</span>`;
    message.firstElementChild.style.color = color;
    checkButton.classList.add("btn--disabled");
    checkButton.disabled = true;
}



// === 7. Handle the check button click ===
function handleCheck() {
    const currentInputs = Array.from({ length: NUMBER_OF_LETTERS }, (_, i) =>
        document.querySelector(`#guess-${currentTry}-letter-${i}`).value.toUpperCase()
    );

    const resultClasses = checkGuess(currentInputs, targetWord);
    let isSuccess = true;

    // Apply result styling to each input
    resultClasses.forEach((className, i) => {
        const input = document.querySelector(`#guess-${currentTry}-letter-${i}`);
        input.classList.add(className);
        if (className !== "yes-in-place") isSuccess = false;
    });

    toggleTryInputs(currentTry, false); // Lock current try

    if (isSuccess) {
        showEndMessage("You Win The Word Is", "var(--color-correct)");
        return;
    }

    if (currentTry === NUMBER_OF_TRIES) {
        showEndMessage("You Lose The Word Is", "var(--color-btn)");
        return;
    }


    currentTry++;
    toggleTryInputs(currentTry, true); // Enable next try
    document.querySelector(`#guess-${currentTry}-letter-0`).focus();
}

// === 8. Handle the hint button click ===
function getHint() {
    if (hintCount > 0) {
        putHint();
    }
    if (hintCount == 0) {
        hintButton.classList.add("btn--disabled")
    }

}

function putHint() {
    // Get the enabled Try
    const enabledTry = inputsContainer.querySelector("div:not(.disabled-try)");
    // Get the enabled inputs
    const enabledInputs = Array.from(enabledTry.querySelectorAll("input"))
    // Get the empty inputs from the empty inputs
    const emptyEnabledInputs = enabledInputs.filter((input, i) => {
        return input.value === ""
    })
    // Get the first empty's index of the enabled inputs
    if (emptyEnabledInputs.length !== 0) {


        const inputIndex = enabledInputs.indexOf(emptyEnabledInputs[0]);
        const firstEmptyEnabledInput = emptyEnabledInputs[0];
        firstEmptyEnabledInput.value = targetWord[inputIndex];
        firstEmptyEnabledInput.disabled = true;
        firstEmptyEnabledInput.classList.add("yes-in-place");
        hintCount--;
        hintButton.querySelector("span").innerText = hintCount;

    }




}

// === 9. Initialize the game on window load ===
window.onload = async () => {
    targetWord = await fetchRandomWord();
    console.log(targetWord)
    if (!targetWord) return;

    generateTries();
    checkButton.addEventListener("click", handleCheck);
    hintButton.querySelector("span").innerText = hintCount;
    hintButton.addEventListener("click", getHint)
};
