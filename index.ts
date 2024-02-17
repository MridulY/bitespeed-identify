import express, { Request, Response } from 'express';
import { identifyContact } from './contactController';
import dotenv from 'dotenv';

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.render('index', { contact: null });
});

app.post('/identify', identifyContact);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
