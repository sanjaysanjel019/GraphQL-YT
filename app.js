const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const Event = require('./models/event');

const app = express();
const User = require('./models/user');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
	'/graphql',
	graphqlHTTP({
		schema: buildSchema(`

            type Event{
                _id : ID!
                title : String!
                description : String!
                price : Float!
                date : String!
            }
			type User{
				_id : ID!
				email : String!
				password : String
			}

            input EventInput {
                title:String!
                description : String!
                price : Float!
                date : String!
            }

			input UserInput{
				email : String!
				password : String!
			}

			input EventById{
				id:String!
			}
        
            type RootQuery{
                events: [Event!]!
				findEventById(eventById:EventById):Event
            }

            type RootMutation{
                createEvent(eventInput:EventInput):Event
				createUser(userInput:UserInput):User
            }
            
            schema {
                query: RootQuery
                mutation: RootMutation
            }
        `),
		rootValue: {
			events: () => {
				return Event.find()
					.then((events) => {
						return events.map((event) => {
							return { ...event._doc, _id: event.id };
						});
					})
					.catch((err) => {
						throw err;
					});
			},
			findEventById: (args) => {
				const id = args.eventById.id;
				console.log('ID is ==>', id);
				return Event.findById(id);
			},
			createEvent: (args) => {
				const event = new Event({
					title: args.eventInput.title,
					description: args.eventInput.description,
					price: args.eventInput.price,
					date: new Date(args.eventInput.date),
					creator: '605f673cfedb383b64d23734'
				});
				return event
					.save()
					.then((result) => {
						console.log('Data added  successfully', result);
						return { ...result._doc };
					})
					.catch((err) => {
						console.log(err);
						throw err;
					});
			},
			createUser: (args) => {
				return User.findOne({ email: args.userInput.email }).then((user) => {
					if (!user) {
						return bcrypt
							.hash(args.userInput.password, 12)
							.then((hashedPassword) => {
								const user = new User({
									email: args.userInput.email,
									password: hashedPassword
								});
								return user.save();
							})
							.then((result) => {
								return { ...result._doc, password: null, _id: result.id };
							})
							.catch((err) => {
								throw err;
							});
					}
					if (user) {
						throw new Error('User with that email already exists');
					}
				});
			}
		},
		graphiql: true
	})
);

mongoose
	.connect(
		`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.9hutb.mongodb.net/${process.env
			.MONGO_URI_DB}?retryWrites=true&w=majority`,
		{
			useNewUrlParser: true
		}
	)
	.then(() => {
		console.log('Connection successful');
		app.listen(2000, () => {
			console.log('Server is up and runnin at port 2000.....');
		});
	})
	.catch((err) => {
		console.log('Oops ! DB Connection failed');
		console.log(err);
	});
