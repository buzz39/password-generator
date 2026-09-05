(function () {
  "use strict";

  var SETS = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    punctuation: "!@#$%^&*()_+~`|}{[]:;?><,./-="
  };

  function randomInt(max) {
    // Rejection sampling for an unbiased, cryptographically secure value.
    var limit = Math.floor(4294967296 / max) * max;
    var buf = new Uint32Array(1);
    var value;
    do {
      window.crypto.getRandomValues(buf);
      value = buf[0];
    } while (value >= limit);
    return value % max;
  }

  function pick(charset) {
    return charset.charAt(randomInt(charset.length));
  }

  function shuffle(chars) {
    for (var i = chars.length - 1; i > 0; i--) {
      var j = randomInt(i + 1);
      var tmp = chars[i];
      chars[i] = chars[j];
      chars[j] = tmp;
    }
    return chars;
  }

  function buildPassword(length, selected) {
    var charset = "";
    var chars = [];
    selected.forEach(function (name) {
      charset += SETS[name];
      chars.push(pick(SETS[name])); // guarantee at least one of each selected type
    });
    while (chars.length < length) {
      chars.push(pick(charset));
    }
    return shuffle(chars.slice(0, length)).join("");
  }

  function strengthOf(length, poolSize) {
    var bits = length * (Math.log(poolSize) / Math.log(2));
    if (bits < 50) return { label: "Weak", cls: "weak", bits: bits };
    if (bits < 80) return { label: "Fair", cls: "fair", bits: bits };
    return { label: "Strong", cls: "strong", bits: bits };
  }

  function init() {
    var form = document.getElementById("generator");
    if (!form) return;

    var output = document.getElementById("password-here");
    var alertBox = document.getElementById("alert");
    var lengthInput = document.getElementById("length");
    var lengthValue = document.getElementById("length-value");
    var strengthBox = document.getElementById("strength");
    var generateButton = document.getElementById("generate");
    var copyButton = document.getElementById("copy");
    var boxes = ["lowercase", "uppercase", "numbers", "punctuation"].map(function (id) {
      return document.getElementById(id);
    });
    var timer;

    function notify(message, cls) {
      alertBox.textContent = message;
      alertBox.className = "alert " + (cls || "");
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        alertBox.textContent = "";
        alertBox.className = "alert";
      }, 3000);
    }

    function selectedSets() {
      return boxes.filter(function (box) { return box.checked; })
        .map(function (box) { return box.id; });
    }

    function generate() {
      var selected = selectedSets();
      if (!selected.length) {
        notify("Please select at least one character type.", "fail");
        return;
      }
      var length = Number(lengthInput.value);
      if (length < selected.length) {
        notify("Increase the length to fit every selected character type.", "fail");
        return;
      }
      var poolSize = selected.reduce(function (total, name) {
        return total + SETS[name].length;
      }, 0);
      output.textContent = buildPassword(length, selected);
      var strength = strengthOf(length, poolSize);
      strengthBox.innerHTML = "Strength: <strong class=\"" + strength.cls + "\">" +
        strength.label + "</strong> (~" + Math.round(strength.bits) + " bits of entropy)";
    }

    function syncLength() {
      lengthValue.textContent = lengthInput.value;
    }

    lengthInput.addEventListener("input", syncLength);
    generateButton.addEventListener("click", generate);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      generate();
    });

    copyButton.addEventListener("click", function () {
      var text = output.textContent.trim();
      if (!text || text === "----") {
        notify("Generate a password first.", "fail");
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          notify("Copied to clipboard.", "success");
        }, function () {
          notify("Copy failed — select the text manually.", "fail");
        });
      } else {
        notify("Copy failed — select the text manually.", "fail");
      }
    });

    syncLength();
    generate();
  }

  var WORDLIST = [
    "abandon","ability","abroad","absorb","accent","accept","access","accord","across","action",
    "active","actor","actual","adapt","add","addict","address","adjust","admit","adult",
    "advance","advice","afford","afraid","again","agent","agree","ahead","alarm","album",
    "alert","alien","allow","almost","alone","along","already","also","alter","always",
    "amount","ancient","anger","angle","animal","ankle","annual","answer","antique","anxiety",
    "apart","apple","apply","arch","area","argue","arm","armor","around","arrange",
    "arrest","arrive","arrow","art","artist","aside","aspect","assault","asset","assist",
    "assume","athlete","atom","attack","attend","attic","auction","audit","august","aunt",
    "author","auto","autumn","average","avocado","avoid","awake","aware","awful","awkward",
    "baby","bachelor","bacon","badge","bag","balance","balcony","ball","bamboo","banana",
    "banner","barely","bargain","barrel","base","basic","basket","battle","beach","bean",
    "bear","beauty","because","become","before","begin","behave","behind","believe","below",
    "bench","benefit","best","betray","better","between","beyond","bicycle","bid","bike",
    "bind","biology","bird","birth","bitter","black","blade","blame","blanket","blast",
    "bleak","bless","blind","blood","blossom","blouse","blue","blur","boat","body",
    "boil","bomb","bond","bone","bonus","book","boost","border","boring","borrow",
    "boss","bottom","bounce","box","boy","bracket","brain","brand","brass","brave",
    "bread","breeze","brick","bridge","brief","bright","bring","brisk","broad","broken",
    "bronze","broom","brother","brown","brush","bubble","buddy","budget","buffalo","build",
    "bulb","bulk","bullet","bundle","bunker","burden","burger","burst","bus","business",
    "busy","butter","buyer","cabin","cable","cactus","cage","cake","call","calm",
    "camera","camp","canal","cancel","candy","canvas","canyon","capable","capital","captain",
    "car","carbon","card","cargo","carpet","carry","cart","case","cash","casino",
    "castle","casual","cat","catalog","catch","category","cattle","caught","cause","caution",
    "cave","ceiling","celery","cement","census","century","cereal","certain","chair","chalk",
    "champion","chance","change","chaos","chapter","charge","chase","chat","cheap","check",
    "cheese","chef","cherry","chest","chicken","chief","child","chimney","choice","choose",
    "chronic","chuckle","chunk","cigar","cinnamon","circle","citizen","city","civil","claim",
    "clarify","claw","clay","clean","clerk","clever","click","client","cliff","climb",
    "clinic","clip","clock","close","cloth","cloud","clown","club","clump","cluster"
  ];

  function buildPassphrase(wordCount, separator, capitalize, includeNumber, includeSymbol) {
    var words = [];
    for (var i = 0; i < wordCount; i++) {
      var word = WORDLIST[randomInt(WORDLIST.length)];
      if (capitalize) word = word.charAt(0).toUpperCase() + word.slice(1);
      words.push(word);
    }
    var phrase = words.join(separator);
    if (includeNumber) phrase += separator + String(randomInt(90) + 10);
    if (includeSymbol) phrase += pick(SETS.punctuation);
    return phrase;
  }

  function initPassphrase() {
    var form = document.getElementById("passphrase-generator");
    if (!form) return;

    var output = document.getElementById("password-here");
    var alertBox = document.getElementById("alert");
    var wordCountInput = document.getElementById("word-count");
    var wordCountValue = document.getElementById("word-count-value");
    var separatorSelect = document.getElementById("separator");
    var capitalizeBox = document.getElementById("capitalize");
    var numberBox = document.getElementById("include-number");
    var symbolBox = document.getElementById("include-symbol");
    var strengthBox = document.getElementById("strength");
    var generateButton = document.getElementById("generate");
    var copyButton = document.getElementById("copy");
    var timer;

    function notify(message, cls) {
      alertBox.textContent = message;
      alertBox.className = "alert " + (cls || "");
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        alertBox.textContent = "";
        alertBox.className = "alert";
      }, 3000);
    }

    function generate() {
      var wordCount = Number(wordCountInput.value);
      var separator = separatorSelect.value === "space" ? " " : (separatorSelect.value === "none" ? "" : separatorSelect.value);
      var phrase = buildPassphrase(wordCount, separator, capitalizeBox.checked, numberBox.checked, symbolBox.checked);
      output.textContent = phrase;
      var bits = wordCount * (Math.log(WORDLIST.length) / Math.log(2));
      if (numberBox.checked) bits += Math.log(90) / Math.log(2);
      if (symbolBox.checked) bits += Math.log(SETS.punctuation.length) / Math.log(2);
      var strength = strengthOf(1, Math.pow(2, bits));
      strengthBox.innerHTML = "Strength: <strong class=\"" + strength.cls + "\">" +
        strength.label + "</strong> (~" + Math.round(bits) + " bits of entropy)";
    }

    function syncWordCount() {
      wordCountValue.textContent = wordCountInput.value;
    }

    wordCountInput.addEventListener("input", syncWordCount);
    generateButton.addEventListener("click", generate);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      generate();
    });

    copyButton.addEventListener("click", function () {
      var text = output.textContent.trim();
      if (!text || text === "----") {
        notify("Generate a passphrase first.", "fail");
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          notify("Copied to clipboard.", "success");
        }, function () {
          notify("Copy failed — select the text manually.", "fail");
        });
      } else {
        notify("Copy failed — select the text manually.", "fail");
      }
    });

    syncWordCount();
    generate();
  }

  var COMMON_PASSWORDS = [
    "password","123456","123456789","qwerty","abc123","letmein","admin","welcome",
    "monkey","dragon","football","iloveyou","000000","111111","123123","password1"
  ];

  function analyzeStrength(value) {
    var hasLower = /[a-z]/.test(value);
    var hasUpper = /[A-Z]/.test(value);
    var hasNumber = /[0-9]/.test(value);
    var hasSymbol = /[^a-zA-Z0-9]/.test(value);
    var poolSize = 0;
    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasNumber) poolSize += 10;
    if (hasSymbol) poolSize += 33;

    var warnings = [];
    if (COMMON_PASSWORDS.indexOf(value.toLowerCase()) !== -1) {
      warnings.push("This is one of the most commonly used passwords — do not use it.");
    }
    if (/^(.)\1+$/.test(value)) {
      warnings.push("Repeating the same character does not add security.");
    }
    if (/0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef/i.test(value)) {
      warnings.push("Sequential characters are easy to guess.");
    }
    if (value.length > 0 && value.length < 12) {
      warnings.push("Longer passwords are generally stronger — consider at least 15 characters.");
    }

    var bits = value.length && poolSize ? value.length * (Math.log(poolSize) / Math.log(2)) : 0;
    var strength = value.length ? strengthOf(1, Math.pow(2, bits)) : { label: "—", cls: "", bits: 0 };

    return {
      length: value.length,
      hasLower: hasLower,
      hasUpper: hasUpper,
      hasNumber: hasNumber,
      hasSymbol: hasSymbol,
      bits: bits,
      strength: strength,
      warnings: warnings
    };
  }

  function initStrengthChecker() {
    var input = document.getElementById("password-input");
    if (!input) return;

    var strengthBox = document.getElementById("strength");
    var detailBox = document.getElementById("strength-detail");
    var warningsBox = document.getElementById("strength-warnings");
    var toggleButton = document.getElementById("toggle-visibility");

    function render() {
      var result = analyzeStrength(input.value);
      if (!result.length) {
        strengthBox.innerHTML = "";
        detailBox.innerHTML = "";
        warningsBox.innerHTML = "";
        return;
      }
      strengthBox.innerHTML = "Strength: <strong class=\"" + result.strength.cls + "\">" +
        result.strength.label + "</strong> (~" + Math.round(result.bits) + " bits of entropy)";
      detailBox.textContent = result.length + " characters · " +
        [result.hasLower && "lowercase", result.hasUpper && "uppercase", result.hasNumber && "numbers", result.hasSymbol && "symbols"]
          .filter(Boolean).join(", ");
      warningsBox.innerHTML = result.warnings.map(function (w) { return "<li>" + w + "</li>"; }).join("");
    }

    input.addEventListener("input", render);

    if (toggleButton) {
      toggleButton.addEventListener("click", function () {
        var isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        toggleButton.textContent = isHidden ? "Hide" : "Show";
      });
    }
  }

  function initAll() {
    init();
    initPassphrase();
    initStrengthChecker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
