/**
 * inputmask.js - Script para aplicar máscaras de entrada a campos de formulario.
 *
 * Autor: [Tu Nombre o Alias]
 * Fecha: [Fecha de Creación]
 *
 * Dependencias: Ninguna
 */

(function() {
  'use strict';

  const maskDefinitions = {
    '9': /\d/,          // Dígito (0-9)
    'a': /[a-z]/,       // Letra minúscula (a-z)
    'A': /[A-Z]/,       // Letra mayúscula (A-Z)
    '*': /[a-zA-Z0-9]/,  // Alfanumérico (0-9, a-z, A-Z)
    '#': /[\d\s\-\+]/,   // Dígito, espacio, guión, más (para números de teléfono internacionales)
    '@': /[a-zA-Z0-9_\.\-]/ // Caracteres válidos para email (simplificado)
  };

  const defaultPlaceholderChar = '_';

  function InputMask(inputElement, mask, options) {
    this.input = inputElement;
    this.mask = mask;
    this.options = options || {};
    this.maskedValue = '';
    this.placeholder = this.options.placeholder || generatePlaceholder(this.mask, this.options.placeholderChar || defaultPlaceholderChar);
    this.input.placeholder = this.placeholder;

    this.init();
  }

  InputMask.prototype = {
    init: function() {
      this.input.addEventListener('input', this.handleInput.bind(this));
      this.input.addEventListener('keydown', this.handleKeyDown.bind(this));
      this.input.addEventListener('blur', this.handleBlur.bind(this));
      this.input.addEventListener('focus', this.handleFocus.bind(this));

      // Inicializar el valor si ya hay uno
      if (this.input.value) {
        this.formatValue(this.input.value);
      }
    },

    handleInput: function(event) {
      event.preventDefault(); // Prevenir comportamiento por defecto para controlar la entrada

      let inputEventValue = this.input.value;
      let originalInputValue = this.maskedValue;
      let formattedValue = '';
      let valueIndex = 0;
      let selectionStart = this.input.selectionStart;
      let inputChar = '';
      let isDeletion = false;

      if (inputEventValue.length < originalInputValue.length) {
        isDeletion = true;
      }

      for (let maskIndex = 0; maskIndex < this.mask.length; maskIndex++) {
        const maskChar = this.mask[maskIndex];
        const inputCharFromEvent = inputEventValue[valueIndex];

        if (maskDefinitions[maskChar]) { // Es un carácter de máscara
          if (inputCharFromEvent && maskDefinitions[maskChar].test(inputCharFromEvent)) {
            formattedValue += inputCharFromEvent;
            valueIndex++;
          } else {
            formattedValue += this.options.placeholderChar || defaultPlaceholderChar; // Usar placeholder
          }
        } else { // Es un carácter literal
          formattedValue += maskChar;
          if (inputCharFromEvent === maskChar) { // Saltar si el literal coincide en la entrada
            valueIndex++;
          }
        }
      }

      this.maskedValue = formattedValue;
      this.input.value = formattedValue;

      // Ajustar la posición del cursor después de la entrada
      if (!isDeletion) {
          let nextCursorPosition = selectionStart;
          while (nextCursorPosition < this.mask.length && !maskDefinitions[this.mask[nextCursorPosition]]) {
              nextCursorPosition++; // Saltar literales al avanzar cursor
          }
          this.input.selectionStart = this.input.selectionEnd = Math.min(nextCursorPosition, this.mask.length);
      } else {
          this.input.selectionStart = this.input.selectionEnd = selectionStart; // Mantener cursor en borrado
      }

      this.dispatchChangeEvent(); // Disparar evento 'change' para reactividad de formularios
    },

    handleKeyDown: function(event) {
      const key = event.key;

      if (key === 'Backspace' || key === 'Delete') {
        event.preventDefault(); // Prevenir borrado por defecto

        let selectionStart = this.input.selectionStart;
        let selectionEnd = this.input.selectionEnd;
        let newMaskedValue = this.maskedValue;

        if (selectionStart === selectionEnd) { // No hay selección
          let deletePosition = (key === 'Backspace') ? selectionStart - 1 : selectionStart;

          if (deletePosition >= 0 && maskDefinitions[this.mask[deletePosition]]) {
            newMaskedValue = newMaskedValue.substring(0, deletePosition) + (this.options.placeholderChar || defaultPlaceholderChar) + newMaskedValue.substring(deletePosition + 1);
            this.maskedValue = newMaskedValue;
            this.input.value = newMaskedValue;
            this.input.selectionStart = this.input.selectionEnd = deletePosition; // Mover cursor al borrado

            this.dispatchChangeEvent();
          }
        } else { // Hay selección, borrar la selección y reemplazar con placeholders
          let start = Math.min(selectionStart, selectionEnd);
          let end = Math.max(selectionStart, selectionEnd);

          let tempMaskedValue = '';
          for (let i = 0; i < this.mask.length; i++) {
            if (i >= start && i < end && maskDefinitions[this.mask[i]]) {
              tempMaskedValue += this.options.placeholderChar || defaultPlaceholderChar;
            } else {
              tempMaskedValue += this.maskedValue[i];
            }
          }
          this.maskedValue = tempMaskedValue;
          this.input.value = tempMaskedValue;
          this.input.selectionStart = this.input.selectionEnd = start; // Mover cursor al inicio de la selección borrada

          this.dispatchChangeEvent();
        }
      }
    },

    handleBlur: function() {
      if (this.options.clearIfNotMatch && this.is incomplete()) {
        this.input.value = '';
        this.maskedValue = '';
        this.dispatchChangeEvent();
      }
    },

    handleFocus: function() {
      if (this.options.selectOnFocus) {
        this.input.select();
      }
    },

    formatValue: function(value) {
      let formattedValue = '';
      let valueIndex = 0;

      for (let maskIndex = 0; maskIndex < this.mask.length; maskIndex++) {
        const maskChar = this.mask[maskIndex];
        const inputCharFromValue = value[valueIndex];

        if (maskDefinitions[maskChar]) {
          if (inputCharFromValue && maskDefinitions[maskChar].test(inputCharFromValue)) {
            formattedValue += inputCharFromValue;
            valueIndex++;
          } else {
            formattedValue += this.options.placeholderChar || defaultPlaceholderChar;
          }
        } else {
          formattedValue += maskChar;
          if (inputCharFromValue === maskChar) {
            valueIndex++;
          }
        }
      }
      this.maskedValue = formattedValue;
      this.input.value = formattedValue;
    },

    unmaskedValue: function() {
      let unmasked = '';
      for (let i = 0; i < this.maskedValue.length; i++) {
        if (maskDefinitions[this.mask[i]]) {
          if (this.maskedValue[i] !== (this.options.placeholderChar || defaultPlaceholderChar)) {
            unmasked += this.maskedValue[i];
          }
        }
      }
      return unmasked;
    },

    isComplete: function() {
      for (let i = 0; i < this.mask.length; i++) {
        if (maskDefinitions[this.mask[i]] && this.maskedValue[i] === (this.options.placeholderChar || defaultPlaceholderChar)) {
          return false;
        }
      }
      return true;
    },

    dispatchChangeEvent: function() {
      const changeEvent = new Event('change', { bubbles: true, cancelable: true });
      this.input.dispatchEvent(changeEvent);
    }
  };

  function generatePlaceholder(mask, placeholderChar) {
    let placeholder = '';
    for (let i = 0; i < mask.length; i++) {
      if (maskDefinitions[mask[i]]) {
        placeholder += placeholderChar;
      } else {
        placeholder += mask[i];
      }
    }
    return placeholder;
  }


  // Inicialización automática para inputs con atributo 'data-mask'
  document.addEventListener('DOMContentLoaded', function() {
    const maskedInputs = document.querySelectorAll('[data-mask]');
    maskedInputs.forEach(input => {
      const mask = input.dataset.mask;
      const options = {
        placeholder: input.dataset.maskPlaceholder,
        placeholderChar: input.dataset.maskPlaceholderChar,
        clearIfNotMatch: input.dataset.maskClearIfNotMatch !== undefined,
        selectOnFocus: input.dataset.maskSelectOnFocus !== undefined
      };
      new InputMask(input, mask, options);
    });
  });

  window.InputMask = InputMask; // Para acceso global si es necesario

})();