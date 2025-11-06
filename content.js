(function() {
  'use strict';

  const STORAGE_KEY = 'periodontalChartData';
  const IFRAME_STORAGE_KEY = 'periodontalChartData_iframe';
  let saveTimeout = null;
  let isRestoring = false;
  let iframeDocument = null;

  function getIframeDocument() {
    if (iframeDocument) return iframeDocument;
    
    const iframe = document.getElementById('periodontalchart');
    if (iframe && iframe.contentDocument) {
      iframeDocument = iframe.contentDocument;
      return iframeDocument;
    }
    return null;
  }

  function captureChartData() {
    const data = {
      timestamp: Date.now(),
      mainPage: captureFromDocument(document),
      iframePage: null
    };

    const iframeDoc = getIframeDocument();
    if (iframeDoc) {
      data.iframePage = captureFromDocument(iframeDoc);
    }

    console.log('Captured data:', data);
    return data;
  }

  function captureFromDocument(doc) {
    const data = {
      inputs: {},
      divStates: {},
      selectValues: {},
      textareaValues: {}
    };

    doc.querySelectorAll('input').forEach(input => {
      const key = input.id || input.name;
      if (key) {
        if (input.type === 'checkbox' || input.type === 'radio') {
          data.inputs[key] = input.checked;
        } else {
          data.inputs[key] = input.value;
        }
      }
    });

    doc.querySelectorAll('select').forEach(select => {
      const key = select.id || select.name;
      if (key) {
        data.selectValues[key] = select.value;
      }
    });

    doc.querySelectorAll('textarea').forEach(textarea => {
      const key = textarea.id || textarea.name;
      if (key) {
        data.textareaValues[key] = textarea.value;
      }
    });

    doc.querySelectorAll('div[id]').forEach(div => {
      if (div.id && div.style.display) {
        data.divStates[div.id] = {
          display: div.style.display,
          classList: Array.from(div.classList)
        };
      }
    });

    return data;
  }

  function restoreChartData(data) {
    if (!data || isRestoring) return;
    
    isRestoring = true;
    console.log('Restoring data:', data);

    try {
      if (data.mainPage) {
        restoreToDocument(document, data.mainPage);
      }

      const iframeDoc = getIframeDocument();
      if (iframeDoc && data.iframePage) {
        restoreToDocument(iframeDoc, data.iframePage);
      }

      console.log('Data restored successfully');
    } catch (error) {
      console.error('Error restoring data:', error);
    } finally {
      setTimeout(() => {
        isRestoring = false;
      }, 500);
    }
  }

  function restoreToDocument(doc, data) {
    if (data.inputs) {
      Object.keys(data.inputs).forEach(key => {
        const input = doc.getElementById(key) || doc.querySelector(`input[name="${key}"]`);
        if (input) {
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = data.inputs[key];
          } else {
            input.value = data.inputs[key];
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }

    if (data.selectValues) {
      Object.keys(data.selectValues).forEach(key => {
        const select = doc.getElementById(key) || doc.querySelector(`select[name="${key}"]`);
        if (select) {
          select.value = data.selectValues[key];
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }

    if (data.textareaValues) {
      Object.keys(data.textareaValues).forEach(key => {
        const textarea = doc.getElementById(key) || doc.querySelector(`textarea[name="${key}"]`);
        if (textarea) {
          textarea.value = data.textareaValues[key];
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }

    if (data.divStates) {
      Object.keys(data.divStates).forEach(key => {
        const div = doc.getElementById(key);
        if (div && data.divStates[key]) {
          if (data.divStates[key].display) {
            div.style.display = data.divStates[key].display;
          }
          if (data.divStates[key].classList) {
            div.className = data.divStates[key].classList.join(' ');
          }
        }
      });
    }
  }

  function saveChartData() {
    if (isRestoring) return;
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        const data = captureChartData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('Chart data saved to localStorage');
        showSaveIndicator();
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }, 500);
  }

  function showSaveIndicator() {
    let indicator = document.getElementById('perio-save-flash');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'perio-save-flash';
      indicator.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 8px;">
          <circle cx="12" cy="12" r="10" fill="#10b981" stroke="#059669" stroke-width="2"/>
          <path d="M8 12l3 3 5-6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span style="vertical-align: middle;">Saved Successfully</span>
      `;
      indicator.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 999999;
        padding: 12px 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        opacity: 0;
        transform: translateX(20px);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35), 0 2px 8px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
        pointer-events: none;
      `;
      document.body.appendChild(indicator);
    }
    
    // Trigger animation
    setTimeout(() => {
      indicator.style.opacity = '1';
      indicator.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
      indicator.style.opacity = '0';
      indicator.style.transform = 'translateX(20px)';
    }, 2000);
  }

  function resetAllData() {
    const confirmed = confirm(
      '⚠️ RESET PERIODONTAL CHART?\n\n' +
      'This will permanently delete:\n' +
      '• All patient information\n' +
      '• All tooth measurements\n' +
      '• All notes and markings\n' +
      '• All saved chart data\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Are you absolutely sure?'
    );
    
    if (!confirmed) return;

    const doubleCheck = confirm('Click OK to confirm deletion of all chart data.');
    if (!doubleCheck) return;

    localStorage.removeItem(STORAGE_KEY);
    console.log('LocalStorage cleared');

    clearFormData(document);

    const iframeDoc = getIframeDocument();
    if (iframeDoc) {
      clearFormData(iframeDoc);
    }

    alert('✓ Chart data has been reset!\n\nReloading page...');
    
    setTimeout(() => {
      location.reload();
    }, 500);
  }

  function clearFormData(doc) {
    doc.querySelectorAll('input').forEach(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = false;
      } else {
        input.value = '';
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    doc.querySelectorAll('select').forEach(select => {
      select.selectedIndex = 0;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    doc.querySelectorAll('textarea').forEach(textarea => {
      textarea.value = '';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  function addResetButton() {
    if (document.getElementById('perio-ext-reset-btn')) return;

    const resetBtn = document.createElement('button');
    resetBtn.id = 'perio-ext-reset-btn';
    resetBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 6px;">
        <path d="M8 3V1L5 4l3 3V5c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4H2c0 3.31 2.69 6 6 6s6-2.69 6-6-2.69-6-6-6z" fill="currentColor"/>
      </svg>
      Reset All Data
    `;
    resetBtn.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      padding: 14px 28px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #c92a2a 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(201, 42, 42, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      letter-spacing: 0.3px;
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Add shine effect overlay
    const shine = document.createElement('div');
    shine.style.cssText = `
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      transition: left 0.5s;
    `;
    resetBtn.appendChild(shine);

    resetBtn.addEventListener('mouseenter', () => {
      resetBtn.style.transform = 'translateY(-3px) scale(1.03)';
      resetBtn.style.boxShadow = '0 12px 32px rgba(201, 42, 42, 0.5), 0 4px 12px rgba(0, 0, 0, 0.15)';
      resetBtn.style.background = 'linear-gradient(135deg, #ff5252 0%, #f44336 50%, #b71c1c 100%)';
      shine.style.left = '100%';
    });

    resetBtn.addEventListener('mouseleave', () => {
      resetBtn.style.transform = 'translateY(0) scale(1)';
      resetBtn.style.boxShadow = '0 8px 24px rgba(201, 42, 42, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)';
      resetBtn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #c92a2a 100%)';
      shine.style.left = '-100%';
    });

    resetBtn.addEventListener('mousedown', () => {
      resetBtn.style.transform = 'translateY(-1px) scale(0.98)';
    });

    resetBtn.addEventListener('mouseup', () => {
      resetBtn.style.transform = 'translateY(-3px) scale(1.03)';
    });

    resetBtn.addEventListener('click', resetAllData);

    document.body.appendChild(resetBtn);
    console.log('Reset button added');
  }

  function setupEventListenersForDocument(doc, label) {
    doc.addEventListener('input', (e) => {
      if (e.target.matches('input, textarea')) {
        console.log(`Input changed in ${label}:`, e.target.id || e.target.name);
        saveChartData();
      }
    });

    doc.addEventListener('change', (e) => {
      if (e.target.matches('input, select, textarea')) {
        console.log(`Change event in ${label}:`, e.target.id || e.target.name);
        saveChartData();
      }
    });

    doc.addEventListener('click', (e) => {
      if (e.target.closest('div[onclick]') || 
          e.target.matches('button') ||
          e.target.matches('[id*="implantat"]') ||
          e.target.matches('[id*="furcation"]')) {
        console.log(`Click event in ${label}`);
        setTimeout(saveChartData, 100);
      }
    });

    console.log(`Event listeners setup complete for ${label}`);
  }

  function setupEventListeners() {
    setupEventListenersForDocument(document, 'main page');

    const iframeDoc = getIframeDocument();
    if (iframeDoc) {
      setupEventListenersForDocument(iframeDoc, 'iframe');
    }

    window.addEventListener('beforeunload', () => {
      if (!isRestoring) {
        const data = captureChartData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    });
  }

  function init() {
    console.log('Periodontal Chart Data Saver Extension initialized (LocalStorage version)');

    setTimeout(() => {
      addResetButton();
    }, 500);

    const iframe = document.getElementById('periodontalchart');
    if (iframe) {
      iframe.addEventListener('load', () => {
        console.log('Iframe loaded, setting up...');
        
        try {
          const savedData = localStorage.getItem(STORAGE_KEY);
          if (savedData) {
            const data = JSON.parse(savedData);
            console.log('Found saved data in localStorage, restoring...');
            setTimeout(() => {
              restoreChartData(data);
            }, 500);
          } else {
            console.log('No saved data found in localStorage');
          }
        } catch (error) {
          console.error('Error loading data:', error);
        }

        setTimeout(() => {
          setupEventListeners();
        }, 800);
      });
    } else {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const data = JSON.parse(savedData);
          console.log('Found saved data in localStorage, restoring...');
          setTimeout(() => {
            restoreChartData(data);
          }, 500);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }

      setTimeout(() => {
        setupEventListeners();
      }, 800);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
