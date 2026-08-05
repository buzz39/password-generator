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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
