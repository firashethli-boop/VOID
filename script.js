
/* VOID — site interactions and forms */

const VOID_CONFIG = {
  emailjsPublicKey: "Loa2qYPkRn1mwnrqX",
  emailjsServiceId: "service_315oqxe",
  emailjsTemplateId: "template_kohqntv",

  cloudinaryCloudName: "odugclaw",
  cloudinaryUploadPreset: "void_unsigned",
  maxFileSizeMB: 10,

  // Add your Supabase values when the database is ready.
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY"
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];


/* =========================
   GENERAL MESSAGE
========================= */

function setMessage(el, message, type = "") {
  if (!el) return;
  el.textContent = message;
  el.className = `form-result ${type}`.trim();
}


/* =========================
   NAVIGATION
========================= */

function setupNavigation() {
  const button = $(".menu-toggle");
  const nav = $(".main-nav");

  if (!button || !nav) return;

  button.addEventListener("click", () => {
    const open = nav.classList.toggle("nav-open");
    button.setAttribute("aria-expanded", String(open));
  });
}


/* =========================
   ARCHIVE FILTERS
========================= */

function setupArchiveFilters() {
  const filters = $("#archiveFilters");
  const grid = $("#archiveGrid");

  if (!filters || !grid) return;

  filters.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    const category = button.dataset.filter;

    $$(".filter-btn", filters).forEach(item => {
      item.classList.toggle("active", item === button);
    });

    let count = 0;

    $$(".archive-card", grid).forEach(card => {
      const visible =
        category === "All" ||
        card.dataset.category === category;

      card.hidden = !visible;

      if (visible) count++;
    });

    const archiveCount = $("#archiveCount");

    if (archiveCount) {
      archiveCount.textContent =
        `${String(count).padStart(2, "0")} PIECES`;
    }
  });
}


/* =========================
   FILE SIZE
========================= */

function formatBytes(bytes) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1048576).toFixed(2)} MB`;
}


/* =========================
   CLOUDINARY UPLOAD
========================= */

async function uploadToCloudinary(file) {
  const cfg = VOID_CONFIG;

  const data = new FormData();

  data.append("file", file);
  data.append("upload_preset", cfg.cloudinaryUploadPreset);
  data.append("folder", "void-designs");

  const endpoint =
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudinaryCloudName)}/image/upload`;

  const response = await fetch(endpoint, {
    method: "POST",
    body: data
  });

  const payload = await response.json();

  if (!response.ok || !payload.secure_url) {
    throw new Error(
      payload?.error?.message || "Cloudinary upload failed."
    );
  }

  return payload.secure_url;
}


/* =========================
   CUSTOM REQUEST
========================= */

function setupCustomRequest() {
  const form = $("#designForm");

  if (!form) return;

  const result = $("#result");
  const button = $("#submitButton");

  const fileInput = $("#design");
  const preview = $("#preview");
  const previewImage = $("#previewImage");

  const phoneInput = $("#client_contact");

  const selectedCountry = $("#selectedCountry");
  const countryBrowser = $("#countryBrowser");
  const countryGrid = $("#countryGrid");
  const countrySearch = $("#countrySearch");
  const moreCountries = $("#moreCountries");

  let iti = null;
  let previewUrl = null;

  const maxBytes =
    VOID_CONFIG.maxFileSizeMB * 1024 * 1024;

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  /* EMAILJS INIT */

  if (window.emailjs) {
    emailjs.init({
      publicKey: VOID_CONFIG.emailjsPublicKey
    });
  }


  /* PHONE COUNTRY SELECTOR */

  let updateCountryDisplay = () => {};

  if (phoneInput && window.intlTelInput) {

   iti = window.intlTelInput(phoneInput, {
  initialCountry: "tn",
  separateDialCode: true,
  nationalMode: true,
  autoPlaceholder: "polite",
  loadUtils: () =>
    import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js")
});
    const countryData =
      window.intlTelInput.getCountryData();

    const flagUrl = iso2 =>
      `https://flagcdn.com/w40/${iso2}.png`;

    updateCountryDisplay = country => {
      if (!country) return;

      if (selectedCountry) {
        selectedCountry.innerHTML = `
          <img src="${flagUrl(country.iso2)}" alt="">
          <strong>${country.name}</strong>
          <span>+${country.dialCode}</span>
        `;
      }

      $$(".flag-choice[data-country]").forEach(btn => {
        btn.classList.toggle(
          "active",
          btn.dataset.country === country.iso2
        );
      });
    };

    const chooseCountry = iso2 => {
      iti.setCountry(iso2);

      const country = countryData.find(
        item => item.iso2 === iso2
      );

      updateCountryDisplay(country);

      if (countryBrowser) {
        countryBrowser.hidden = true;
      }

      if (moreCountries) {
        moreCountries.setAttribute(
          "aria-expanded",
          "false"
        );
      }

      phoneInput.focus();
    };

    const renderCountries = query => {
      if (!countryGrid) return;

      const q = query.trim().toLowerCase();

      const matches = countryData.filter(country =>
        country.name.toLowerCase().includes(q) ||
        country.dialCode.includes(q.replace(/^\+/, ""))
      );

      countryGrid.replaceChildren();

      matches.forEach(country => {
        const item = document.createElement("button");

        item.type = "button";
        item.className = "country-option";

        item.innerHTML = `
          <img src="${flagUrl(country.iso2)}" alt="">
          <span>${country.name}</span>
          <strong>+${country.dialCode}</strong>
        `;

        item.addEventListener("click", () => {
          chooseCountry(country.iso2);
        });

        countryGrid.append(item);
      });

      if (!matches.length) {
        countryGrid.textContent = "No countries found.";
      }
    };

    updateCountryDisplay(
      countryData.find(item => item.iso2 === "tn")
    );

    $$(".flag-choice[data-country]").forEach(btn => {
      btn.addEventListener("click", () => {
        chooseCountry(btn.dataset.country);
      });
    });

    if (moreCountries) {
      moreCountries.addEventListener("click", () => {
        if (!countryBrowser) return;

        countryBrowser.hidden = !countryBrowser.hidden;

        moreCountries.setAttribute(
          "aria-expanded",
          String(!countryBrowser.hidden)
        );

        if (!countryBrowser.hidden) {
          renderCountries("");

          if (countrySearch) {
            countrySearch.focus();
          }
        }
      });
    }

    if (countrySearch) {
      countrySearch.addEventListener("input", () => {
        renderCountries(countrySearch.value);
      });
    }
  }


  /* SIZE SELECTION */

  const sizeButtons = $$(".size-options button");

  sizeButtons.forEach(btn => {
    btn.addEventListener("click", () => {

      sizeButtons.forEach(item => {
        item.classList.remove("active");
      });

      btn.classList.add("active");

    });
  });


  /* COLOR SELECTION */

  const colorButtons = $$(".color-btn");

  colorButtons.forEach(btn => {
    btn.addEventListener("click", () => {

      colorButtons.forEach(item => {
        item.classList.remove("active");
      });

      btn.classList.add("active");

    });
  });


  /* CLEAR FILE PREVIEW */

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    previewUrl = null;

    if (preview) preview.hidden = true;

    if (previewImage) {
      previewImage.removeAttribute("src");
    }

    if (fileInput) {
      fileInput.value = "";
    }

    const fileName = $("#fileName");
    const fileSize = $("#fileSize");

    if (fileName) fileName.textContent = "";
    if (fileSize) fileSize.textContent = "";
  };


  /* FILE INPUT */

  if (fileInput) {

    fileInput.addEventListener("change", () => {

      const file = fileInput.files?.[0];

      if (!file) {
        clearPreview();
        return;
      }

      if (
        !allowed.includes(file.type) ||
        file.size > maxBytes
      ) {
        clearPreview();

        setMessage(
          result,
          `Choose JPG, PNG or WEBP up to ${VOID_CONFIG.maxFileSizeMB} MB.`,
          "error"
        );

        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      previewUrl = URL.createObjectURL(file);

      if (previewImage) {
        previewImage.src = previewUrl;
      }

      const fileName = $("#fileName");
      const fileSize = $("#fileSize");

      if (fileName) fileName.textContent = file.name;
      if (fileSize) fileSize.textContent = formatBytes(file.size);

      if (preview) preview.hidden = false;

      setMessage(result, "Image ready to upload.");
    });
  }


  /* REMOVE FILE */

  const removeFile = $("#removeFile");

  if (removeFile) {
    removeFile.addEventListener("click", clearPreview);
  }


  /* FORM SUBMISSION */

  form.addEventListener("submit", async event => {

    event.preventDefault();

    if (!form.reportValidity()) return;


    /* NAME VALIDATION */

    const name = form.elements.client_name.value
      .trim()
      .replace(/\s+/g, " ");

    const namePattern =
      /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)+$/;

    if (!namePattern.test(name)) {
      setMessage(
        result,
        "Enter your first and last name using letters only.",
        "error"
      );

      form.elements.client_name.focus();
      return;
    }


    /* PHONE VALIDATION */

   /* PHONE VALIDATION */

if (!iti) {
  setMessage(
    result,
    "Phone selector failed to load. Please refresh the page.",
    "error"
  );
  return;
}

try {
  await iti.promise;
} catch (error) {
  setMessage(
    result,
    "Phone validation failed to load. Check your internet connection.",
    "error"
  );
  return;
}

const phoneValue = phoneInput.value.trim();

if (!phoneValue ) {
  setMessage(
    result,
    "Enter a valid phone number for the selected country.",
    "error"
  );
  phoneInput.focus();
  return;
}

const internationalPhone = iti.getNumber();


    /* SIZE VALIDATION */

    const selectedSize =
      $(".size-options button.active");

    if (!selectedSize) {
      setMessage(
        result,
        "Please choose your size.",
        "error"
      );

      return;
    }


    /* COLOR VALIDATION */

    const selectedColor =
      $(".color-btn.active");

    if (!selectedColor) {
      setMessage(
        result,
        "Please choose your color.",
        "error"
      );

      return;
    }


    /* EMAILJS CHECK */

    if (!window.emailjs) {
      setMessage(
        result,
        "Email service did not load. Check your connection and refresh.",
        "error"
      );

      return;
    }


    /* FILE */

    const file = fileInput?.files?.[0];

    button.disabled = true;
    button.textContent = "SENDING...";


    try {

      /* CLOUDINARY UPLOAD */

      let designUrl = "No image attached";

      if (file) {

        setMessage(
          result,
          "1/2 — Uploading your image..."
        );

        designUrl = await uploadToCloudinary(file);
      }


      /* EMAIL PARAMETERS */

      setMessage(
        result,
        "2/2 — Sending your request..."
      );

      console.log("CLIENT EMAIL:", document.querySelector("#client_email")?.value);
      const emailInput = document.getElementById("client_email");

      console.log("EMAIL INPUT:", emailInput);
      console.log("EMAIL VALUE:", emailInput?.value);
      const params = {
      client_name: name,
      client_contact: internationalPhone,
      client_email: document.getElementById("client_email").value.trim(),

      product: form.elements.product.value,
      size: selectedSize.textContent.trim(),
      color: selectedColor.getAttribute("title") ||
      selectedColor.dataset.color ||
      "Selected color",
      details: form.elements.details.value.trim() || "No extra details",
      design_url: designUrl,
      file_name: file?.name || "No File"
     };

      console.log("ORDER DATA:", params);
      /* SEND EMAIL */

      await emailjs.send(
        VOID_CONFIG.emailjsServiceId,
        VOID_CONFIG.emailjsTemplateId,
        params
      );


      /* SUCCESS */

      setMessage(
        result,
        "SUCCESS — Your request has been sent. We'll get back to you soon.",
        "success"
      );

      form.reset();

      clearPreview();


      /* RESET SIZE AND COLOR */

      sizeButtons.forEach(btn => {
        btn.classList.remove("active");
      });

      colorButtons.forEach(btn => {
        btn.classList.remove("active");
      });


      /* RESET PHONE TO TUNISIA */

      if (iti) {

        iti.setCountry("tn");

        updateCountryDisplay(
          window.intlTelInput
            .getCountryData()
            .find(item => item.iso2 === "tn")
        );
      }

    } catch (error) {

      console.error("VOID request error:", error);

      const details = [
        error?.message,
        error?.text,
        error?.status
      ].filter(Boolean).join(" | ");

      setMessage(
        result,
        `Error: ${details || "Unable to send request."}`,
        "error"
      );

    } finally {

      button.disabled = false;

      button.innerHTML =
        'SEND YOUR SIGNAL <span>↗</span>';

    }

  });
}


/* =========================
   SUPABASE CONFIGURATION
========================= */

function supabaseConfigured() {

  return (
    VOID_CONFIG.supabaseUrl.startsWith("https://") &&
    !VOID_CONFIG.supabaseUrl.includes("YOUR_PROJECT") &&
    VOID_CONFIG.supabaseAnonKey.length > 20 &&
    !VOID_CONFIG.supabaseAnonKey.includes("YOUR_SUPABASE")
  );

}


/* =========================
   SUPABASE REQUEST
========================= */

async function supabaseRequest(path, options = {}) {

  if (!supabaseConfigured()) {
    throw new Error(
      "Reviews database is not configured yet. Follow SUPABASE_SETUP.txt."
    );
  }

  const response = await fetch(
    `${VOID_CONFIG.supabaseUrl}/rest/v1/${path}`,
    {
      ...options,

      headers: {
        apikey: VOID_CONFIG.supabaseAnonKey,

        Authorization:
          `Bearer ${VOID_CONFIG.supabaseAnonKey}`,

        "Content-Type": "application/json",

        ...(options.headers || {})
      }
    }
  );

  if (!response.ok) {

    const body = await response.text();

    throw new Error(
      body || `Database error (${response.status})`
    );
  }

  if (response.status === 204) return null;

  return response.json();
}


/* =========================
   RENDER REVIEWS
========================= */

function renderReview(review) {

  const card = document.createElement("article");

  card.className = "review-card";

  const top = document.createElement("div");

  top.className = "review-card-top";

  const name = document.createElement("strong");

  name.textContent = review.name;

  const stars = document.createElement("span");

  stars.className = "review-stars";

  stars.textContent =
    "★".repeat(review.rating) +
    "☆".repeat(5 - review.rating);

  top.append(name, stars);

  const message = document.createElement("p");

  message.textContent = review.message;

  const date = document.createElement("div");

  date.className = "review-date";

  date.textContent =
    new Date(review.created_at).toLocaleDateString("fr-FR");

  card.append(top, message, date);

  return card;
}


/* =========================
   LOAD REVIEWS
========================= */

async function loadReviews() {

  const list = $("#reviewList");

  const homeList = $("#homeReviewPreview");

  if (!list && !homeList) return;

  try {

    const reviews = await supabaseRequest(
      "void_reviews?select=name,rating,message,created_at&status=eq.approved&order=created_at.desc&limit=50"
    );

    const average = reviews.length
      ? (
          reviews.reduce(
            (sum, item) => sum + item.rating,
            0
          ) / reviews.length
        ).toFixed(1)
      : "—";

    const summary =
      `${reviews.length} approved ${reviews.length === 1 ? "review" : "reviews"}`;

    if ($("#reviewAverage")) {
      $("#reviewAverage").textContent = average;
    }

    if ($("#reviewCount")) {
      $("#reviewCount").textContent = summary;
    }

    if ($("#homeReviewScore")) {
      $("#homeReviewScore").textContent = average;
    }

    if ($("#homeReviewMeta")) {
      $("#homeReviewMeta").textContent = summary;
    }

    [list, homeList].filter(Boolean).forEach(container => {

      container.replaceChildren();

      const shown =
        container === homeList
          ? reviews.slice(0, 2)
          : reviews;

      if (!shown.length) {

        const empty = document.createElement("div");

        empty.className = "empty-reviews";

        empty.textContent =
          "No approved reviews yet. Be the first to leave your mark.";

        container.append(empty);

      } else {

        shown.forEach(review => {
          container.append(renderReview(review));
        });

      }

    });

  } catch (error) {

    console.warn("VOID reviews:", error);

    [list, homeList].filter(Boolean).forEach(container => {

      container.innerHTML =
        '<div class="empty-reviews">VOID VOICES will be online after the database setup is completed.</div>';

    });

    if ($("#reviewCount")) {
      $("#reviewCount").textContent =
        "Database setup required.";
    }

  }
}


/* =========================
   REVIEW FORM
========================= */

function setupReviewForm() {

  const form = $("#reviewForm");

  if (!form) return;

  const result = $("#reviewResult");

  const submit = $("#reviewSubmit");

  let rating = 0;

  const stars = $$("#ratingPicker button");

  const updateStars = () => {

    stars.forEach(button => {

      button.classList.toggle(
        "selected",
        Number(button.dataset.rating) <= rating
      );

    });

  };


  stars.forEach(button => {

    button.addEventListener("click", () => {

      rating = Number(button.dataset.rating);

      updateStars();

    });

  });


  form.addEventListener("submit", async event => {

    event.preventDefault();

    if (!form.reportValidity()) return;

    if (!rating) {
      return setMessage(
        result,
        "Please choose a star rating.",
        "error"
      );
    }

    submit.disabled = true;

    try {

      await supabaseRequest(
        "void_reviews",
        {
          method: "POST",

          headers: {
            Prefer: "return=minimal"
          },

          body: JSON.stringify({

            name:
              form.elements.review_name.value.trim(),

            rating,

            message:
              form.elements.review_message.value.trim()

          })
        }
      );

      form.reset();

      rating = 0;

      updateStars();

      setMessage(
        result,
        "Thank you. Your review has been saved and is waiting for approval.",
        "success"
      );

    } catch (error) {

      console.error("VOID review submit:", error);

      setMessage(
        result,
        `Could not save review: ${error.message}`,
        "error"
      );

    } finally {

      submit.disabled = false;

    }

  });

}


/* =========================
   START WEBSITE
========================= */

document.addEventListener("DOMContentLoaded", () => {

  setupNavigation();

  setupArchiveFilters();

  setupCustomRequest();

  setupReviewForm();

  loadReviews();

});
