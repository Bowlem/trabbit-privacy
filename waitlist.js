// Wires the waitlist dialog to the app's Supabase project — same project
// the Trabbit app itself uses (see supabase/migrations/
// 0026_waitlist_signups.sql in the app repo). The anon key is safe to ship
// client-side; it can only INSERT into waitlist_signups, per that table's
// row-level security policy.
(function () {
  var SUPABASE_URL = 'https://vyaoexlumymzhpbvhiif.supabase.co';
  var SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YW9leGx1bXltemhwYnZoaWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNTg1NzcsImV4cCI6MjEwMDYzNDU3N30.c0nm5u0I376_h1B2k0qH1xVdlUppIeAx_341YUdmzec';

  var dialog = document.querySelector('[data-waitlist-dialog]');
  if (!dialog) return;

  var form = dialog.querySelector('[data-waitlist-form]');
  var status = dialog.querySelector('[data-waitlist-status]');
  var success = dialog.querySelector('[data-waitlist-success]');
  var emailInput = dialog.querySelector('#waitlist-email');
  var phoneInput = dialog.querySelector('#waitlist-phone');
  var button = form.querySelector('button');

  function resetDialog() {
    form.hidden = false;
    success.hidden = true;
    status.textContent = '';
    button.disabled = false;
    form.reset();
  }

  document.querySelectorAll('[data-waitlist-open]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      resetDialog();
      dialog.showModal();
      emailInput.focus();
    });
  });

  dialog.querySelectorAll('[data-waitlist-close]').forEach(function (closeBtn) {
    closeBtn.addEventListener('click', function () {
      dialog.close();
    });
  });

  // Click on the backdrop (the dialog element itself, outside its content
  // box) closes it — <dialog> doesn't do this natively.
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var email = emailInput.value.trim();
    var phone = phoneInput.value.trim();
    if (!email || !phone) return;

    status.textContent = '';
    button.disabled = true;

    fetch(SUPABASE_URL + '/rest/v1/waitlist_signups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email: email, phone: phone }),
    })
      .then(function (res) {
        // 201 = new signup, 409 = already on the list (unique email) —
        // both read as success to the visitor.
        if (res.ok || res.status === 409) {
          form.hidden = true;
          success.hidden = false;
        } else {
          throw new Error('Waitlist signup failed with status ' + res.status);
        }
      })
      .catch(function () {
        status.textContent = "Something went wrong — try again in a moment.";
        button.disabled = false;
      });
  });
})();
