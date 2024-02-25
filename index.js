const express = require("express"); //include express in this app
const { MongoClient, ObjectId } = require("mongodb"); // import mongoclient from mongodb
const path = require("path"); //module to help with file paths
const dotenv = require("dotenv");

dotenv.config(); //load local environment variables from .env file

//DB Value
// const dburl = "mongodb://127.0.0.1:27017/";
// const client = new MongoClient(dburl);
const dbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_HOST}/`;
const client = new MongoClient(dbUrl);

const app = express(); //create an Express app
const port = process.env.PORT || "8888";

//SET UP TEMPLATE ENGINE (PUG)
app.set("views", path.join(__dirname, "views")); //set up "views" setting to look in the <__dirname>/views folder
app.set("view engine", "pug"); //set up app to use Pug as template engine

//SET UP A PATH FOR STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

//SET UP FOR EASER FORM DATA PARSING
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.listen(port, () => {
	console.log(`Listening on http://localhost:${port}`);
});

// ------------------------------------------------------------------------
// MongoDB Function
async function connection() {
	db = client.db("testdb");
	return db;
}

// function to select all documents in the tourPackages connection.
async function getPackages() {
	db = await connection();
	let result = db.collection("tourPackages").find({});
	let res = await result.toArray();
	return res;
}

//set up some static files
app.get("/", async (request, response) => {
	// test tourPackages()
	let packages = await getPackages();
	// console.log(packages);
	response.render("index", { title: "Home Site", tour: packages });
});

//Admin Pages
app.get("/admin/tour", async (request, response) => {
	let packages = await getPackages();
	response.render("adminTourList", { title: "Lists Package", tour: packages });
});

app.get("/admin/tour/add", async (request, response) => {
	let packages = await getPackages();
	response.render("adminTourAdd", { title: "Add Package", tour: packages });
});

// Edit Form
app.get("/admin/tour/edit", async (request, response) => {
	if (request.query.packageId) {
		let packageToEdit = await getSinglePackage(request.query.packageId);
		let packages = await getPackages();
		response.render("adminTourEdit", {
			title: "Edit Package Tour",
			tour: packages,
			editPackage: packageToEdit
		});
	} else {
		response.redirect("/admin/tour");
	}
});



// --------------------------------------------------------------------------------------
// function to insert one package
async function addPackage(packageData) {
	db = await connection();
	let statuse = await db.collection("tourPackages").insertOne(packageData);
}

// Admin form processing pathes
// Add Form
app.post("/admin/tour/add/submit", async (request, response) => {
	let city = request.body.city;
	let day = parseInt(request.body.duration);
	let image = request.body.image;
	let info = request.body.info;
	let price = parseInt(request.body.price);
	let newPackage = {
		city : city,
		duration : day,
		image: image,
		info: info,
    price: price,
	};
  await addPackage(newPackage);
  response.redirect("/admin/tour");
});

// --------------------------------------------------------------------------------------
// Function to retrieve a single document
async function getSinglePackage(id) {
	console.log("first" + id);
	db = await connection();
	const editId = { _id: new ObjectId(id) };
	console.log("secound" + editId);
	const result = await db.collection("tourPackages").findOne(editId);
	return result;
}

// function to edit one package
async function editPackage(idFilter, updatedPackage) {
	db = await connection();
  let updateSet = { $set: updatedPackage };
	let result = await db.collection("tourPackages").updateOne(idFilter, updateSet);
  if (result.modifiedCount === 1) {
		console.log("Package Updated");
	} else {
		console.log("Package not updated");
	}
}

app.post("/admin/tour/edit/submit", async (request, response) => {
  let id = request.body.packageId;
  let idFilter = { _id: new ObjectId(id) };
  let city = request.body.city;
	let day = parseInt(request.body.duration);
	let image = request.body.image;
	let info = request.body.info;
	let price = parseInt(request.body.price);
  let updatedPackage = {
		city: city,
		duration: day,
		image: image,
    info: info,
		price: price
	};
  await editPackage(idFilter, updatedPackage);
  response.redirect("/admin/tour");
});


// --------------------------------------------------------------------------------------
/* Async function to delete one document by _id. */

app.get("/admin/tour/delete", async (request, response) => {
	if (request.query.packageId) {
			// If packageId is provided, render the confirmDelete page
			response.render("confirmDelete", { title: "Delete Package", packageId: request.query.packageId });
	} else {
			// If packageId is not provided, redirect to the admin tour page
			response.redirect("/admin/tour");
	}
});

// Handle POST request to delete the package
app.post("/admin/tour/delete/submit", async (request, response) => {
	let id = request.body.packageId; // Get the packageId from the form submission
	await deletePackage(id); // Delete the package
	response.redirect("/admin/tour"); // Redirect to the admin tour page after deletion
});

// Function to delete one package
async function deletePackage(id) {
	db = await connection();
	const deleteId = { _id: new ObjectId(id) };
	const result = await db.collection("tourPackages").deleteOne(deleteId);
	if (result.deletedCount === 1) {
			console.log("Successfully deleted one document.");
	} else {
			console.log("Failed to delete document.");
	}
}
