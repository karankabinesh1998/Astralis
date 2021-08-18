const express = require('express');
const bodyParser = require('body-parser')
const dotenv = require('dotenv');
dotenv.config();

const ObjectId = require('mongodb').ObjectId;

const authenticate = require('./middleware/authenticate');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());


const { generateAPIKey, errorHandler, encrypt, decrypt } = require('./utils');

const MongoClient = require('mongodb').MongoClient;

MongoClient.connect(process.env.DB_URL, {
  useUnifiedTopology: true
}, (err, client) => {
  if (err) return console.error(err)
  console.log('Connected to Database', process.env.DB_URL);
	const db = client.db(process.env.DB_NAME);
	const usersCollection = db.collection('users');
	usersCollection.createIndex( { email: 1 } , { unique: true } );
	const transactionCollection = db.collection('transactions');

	//Middleware
	app.use(authenticate(db));

	//Handlers
	app.get('/', (req, res) => {
		res.send('Your express appliation is running Successfully!!')
	});
	
	app.post('/signup', async (req, res) => {
		
		try {

		const apiKey = generateAPIKey();
		const result = await usersCollection.insertOne({ ...req.body, apiKey });
		res.send(result);
			
		} catch (error) {
			// console.log(error);
			if(error?.keyPattern?.email){
				errorHandler(res,409, 'Email already Exists');
			}else{
				errorHandler(res,500, 'General server error');
			}
		}
	});
	
	app.post('/login', async (req, res) => {
		try {
			if (!req.body?.username || !req.body?.password) {
				errorHandler(res, 400, 'username and password are required!');
			}
			const user = await usersCollection.findOne(req.body);
			if (user) {
				res.send(user);
			} else {
				errorHandler(res, 400, 'username or password is incorrect!');
			}
		} catch (err) {
			console.log('Error while login', err);
			errorHandler(res, 500, 'General server error');
		}
	});

	app.post('/transaction', async (req, res) => {
		try {
			const data = encrypt(JSON.stringify(req.body));
			const result = await transactionCollection.insertOne({ data, userId: req.user._id });
			res.send(result);
		} catch (err) {
			console.log('Error while create transaction', err);
			errorHandler(res, 500, 'General server error');
		}
	});

	app.get('/transaction', async (req, res) => {
		try {
			const cursor = await transactionCollection.find({ userId: req.user._id });
			const transcations = await cursor.toArray();
			const decryptedTranscations = transcations.map(trans => {
				trans.data = JSON.parse(decrypt(trans.data));
				return trans;
			})
			res.send(decryptedTranscations);
		} catch (err) {
			console.log('Error while fetching transaction', err);
			errorHandler(res, 500, 'General server error');
		}
	});

	app.put('/transaction', async (req, res) => {
		try {
			const transaction = req.body;
			const transactionId = ObjectId(transaction._id);
			delete transaction._id;
			const data = encrypt(JSON.stringify(transaction));
			const result = await transactionCollection.updateOne({ _id: transactionId }, { $set: { data, userId: req.user._id } });
			res.send(result);
		} catch (err) {
			console.log('Error while updating transaction', err);
			errorHandler(res, 500, 'General server error');
		}
	})

	app.delete('/transaction', async (req, res) => {
		try {
			const transaction = req.body;
			const transactionId = ObjectId(transaction._id);
			const result = await transactionCollection.deleteOne({ _id: transactionId });
			res.send(result);
		} catch (err) {
			console.log('Error while deleting transaction', err);
			errorHandler(res, 500, 'General server error');
		}
	});

	app.listen(process.env.PORT, function() {
		console.log(`Server listening on ${process.env.PORT} `)
	});
});



