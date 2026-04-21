document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------
     Checkbox → Enable/Disable Inputs
  ------------------------------- */

  document.querySelectorAll('.option').forEach(option => {
    const checkbox = option.querySelector('input[type="checkbox"]');
    const fileInputs = option.querySelectorAll('input[type="file"]');
    const textInputs = option.querySelectorAll('input[type="text"], input[type="url"]');

    [...fileInputs, ...textInputs].forEach(i => i.disabled = true);

    if (checkbox) {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          [...fileInputs, ...textInputs].forEach(i => i.disabled = false);
        } else {
          [...fileInputs, ...textInputs].forEach(i => {
            i.value = "";
            i.disabled = true;
          });
        }
      });
    }
  });


  /* ------------------------------
     Drag & Drop Ordering
  ------------------------------- */

  const container = document.getElementById('optionsContainer');
  let dragged = null;

  if (container) {
    container.querySelectorAll('.option').forEach(option => {

      option.draggable = true;

      option.addEventListener('dragstart', () => {
        dragged = option;
        option.classList.add('dragging');
      });

      option.addEventListener('dragend', () => {
        dragged = null;
        option.classList.remove('dragging');
      });

      option.addEventListener('dragover', e => e.preventDefault());

      option.addEventListener('drop', e => {
        e.preventDefault();
        if (dragged && dragged !== option) {
          container.insertBefore(dragged, option);
        }
      });

    });
  }


  /* ------------------------------
     Form Submit → Generate Labels
  ------------------------------- */

  const form = document.querySelector('form'); // safer than using container

  if (!form) return;

  form.addEventListener('submit', function () {

    console.log("SUBMIT HANDLER RUNNING");

    // Remove old dynamic inputs
    document.querySelectorAll('.dynamic-input').forEach(i => i.remove());

    const labels = [];

    const orderedOptions = container.querySelectorAll('.option');

    orderedOptions.forEach(function (opt) {

      const checkbox = opt.querySelector('input[type="checkbox"]');
      if (!checkbox || !checkbox.checked) return;

      const fileInput = opt.querySelector('input[type="file"]');
      const urlInput = opt.querySelector('input[type="url"]');

      const labelElement = opt.querySelector('label');
      let labelText = labelElement
        ? labelElement.textContent.replace(/\s+/g, ' ').trim()
        : "Untitled Section";

      /* ------------------------------
         FILE SECTIONS
      ------------------------------- */
      if (fileInput && fileInput.files.length > 0) {

        for (let i = 0; i < fileInput.files.length; i++) {
          labels.push(labelText);
        }

      }

      /* ------------------------------
         LINK SECTIONS
      ------------------------------- */
      else if (urlInput && urlInput.value.trim() !== "") {

        labels.push(labelText);

        const linkHidden = document.createElement('input');
        linkHidden.type = 'hidden';
        linkHidden.name = 'courseAttainmentLink[]';
        linkHidden.value = urlInput.value.trim();
        linkHidden.classList.add('dynamic-input');
        form.appendChild(linkHidden);
      }

    });

    /* ------------------------------
       Append Labels
    ------------------------------- */

    labels.forEach(label => {
      const labelInput = document.createElement('input');
      labelInput.type = 'hidden';
      labelInput.name = 'labels[]';
      labelInput.value = label;
      labelInput.classList.add('dynamic-input');
      form.appendChild(labelInput);
    });

    console.log("Labels being sent:", labels);

    // Let form submit normally
  });

});
