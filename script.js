// 🔹 Gold Rate
async function fetchGoldRate() {

  console.log("Gold rate function started");

  const goldElement = document.getElementById("goldRate");
  if (!goldElement) {
    console.log("goldRate element not found");
    return;
  }

  try {

    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem("gold_date");
    const savedRate = localStorage.getItem("gold_rate");

    console.log("Saved Date:", savedDate);
    console.log("Today:", today);

    if (savedDate === today && savedRate) {
      console.log("Using cached gold rate:", savedRate);
      goldElement.innerText = savedRate;
      return;
    }

    console.log("Fetching gold rate from API");

    const response = await fetch("https://www.goldapi.io/api/XAU/INR", {
      headers: {
        "x-access-token": "goldapi-ktrjsmlyxh1vs-io",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    console.log("API Response:", data);

    const pricePerGram = data.price / 31.1035;
    const finalRate = pricePerGram.toFixed(0);

    console.log("Gold Rate per gram:", finalRate);

    localStorage.setItem("gold_date", today);
    localStorage.setItem("gold_rate", finalRate);

    goldElement.innerText = finalRate;

  } catch (error) {
    console.error("Gold API error:", error);

    const savedRate = localStorage.getItem("gold_rate") || 5000;
    goldElement.innerText = savedRate;
  }
}


// 🔹 Supabase Config
const supabaseUrl = "https://cepjynxdrtgwxuvgxshy.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlcGp5bnhkcnRnd3h1dmd4c2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDU1NjgsImV4cCI6MjA4ODI4MTU2OH0.iheA__HV_-UA9ryHecSyFEfbotIfq8gp95mJECsytIQ"

console.log("Supabase URL:", supabaseUrl);

const { createClient } = supabase;
const client = createClient(supabaseUrl, supabaseKey);

const bucket = "banners";

let fileInput;
let bannerList;


// 🔹 Load Carousel
async function loadCarouselBanners() {

  console.log("Loading carousel banners");

  const container = document.getElementById("bannerCarousel");
  if (!container) {
    console.log("Carousel container not found");
    return;
  }

  const { data, error } = await client.storage
    .from(bucket)
    .list("", { limit: 100 });

  if (error) {
    console.error("Banner list error:", error);
    return;
  }

  console.log("Banner files:", data);

  if (!data || data.length === 0) {
    container.innerHTML = "<p>No banners found</p>";
    return;
  }

  data.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));

  container.innerHTML = "";

  data.forEach((file, index) => {

    const imageUrl =
      `${supabaseUrl}/storage/v1/object/public/${bucket}/${file.name}`;

    console.log("Banner URL:", imageUrl);

    const div = document.createElement("div");
    div.className = "carousel-item " + (index === 0 ? "active" : "");

    div.innerHTML = `<img src="${imageUrl}" class="d-block w-100">`;

    container.appendChild(div);
  });

}


// 🔹 Page Load
window.addEventListener("load", function () {

  console.log("Page Loaded");

  fetchGoldRate();

  if(document.getElementById("bannerCarousel")){
    console.log("Carousel detected");
    loadCarouselBanners();
  }

  if(document.getElementById("bannerList")){
    console.log("Admin banner list detected");
    loadAdminBanners();
  }

  fileInput = document.getElementById("fileInput");
  bannerList = document.getElementById("bannerList");

});


// 🔹 Upload
async function uploadBanners() {

  console.log("Upload button clicked");

  const files = fileInput.files;

  if (!files.length) {
    alert("Select file first");
    console.log("No file selected");
    return;
  }

  console.log("Files selected:", files);

  for (let file of files) {

    console.log("Uploading:", file.name);

    const fileName = Date.now() + "_" + file.name;

    const { error } = await client.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
      return;
    }

    console.log("Uploaded:", fileName);
  }

  alert("Upload Success");

  fileInput.value = "";

  loadAdminBanners();
}


// 🔹 Delete
async function deleteBanner(fileName) {

  console.log("Deleting banner:", fileName);

  const { error } = await client.storage
    .from(bucket)
    .remove([fileName]);

  if (error) {
    console.error("Delete error:", error);
    alert("Delete failed");
    return;
  }

  console.log("Banner deleted:", fileName);

  alert("Deleted");

  loadAdminBanners();
}


// 🔹 Admin Banner List
async function loadAdminBanners() {

  console.log("Loading admin banner list");

  const { data, error } = await client.storage
    .from(bucket)
    .list("", { limit: 100 });

  if (error) {
    console.error("Admin list error:", error);
    return;
  }

  console.log("Admin banner files:", data);

  bannerList.innerHTML = "";

  data.forEach(file => {

    const imageUrl =
      `${supabaseUrl}/storage/v1/object/public/${bucket}/${file.name}`;

    const div = document.createElement("div");
    div.className = "col-md-3";

    div.innerHTML = `
      <div class="banner-box">
        <img src="${imageUrl}">
        <button class="btn btn-danger w-100 mt-2"
        onclick="deleteBanner('${file.name}')">
        Delete
        </button>
      </div>
    `;

    bannerList.appendChild(div);
  });

}