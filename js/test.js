let set = new Set();
let newArray = [];
let answers = ["1", 2, 3, 4]
let j = 0;
for (let i = Math.floor((Math.random() * 4)); set.size < answers.length; i = Math.floor((Math.random() * 4))) {
    if (set.has(i)) {
        continue
    }
    newArray[i] = answers[j];
    set.add(i)
    j++
}

console.log(newArray)


function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

let randomAnswers = shuffle([...answers]); // استخدم نسخة من answers
console.log(randomAnswers);
