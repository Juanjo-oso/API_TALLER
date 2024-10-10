import express from 'express';
import { read, write } from './src/utils/files.js';
import Joi from 'joi'; // JOI LIBRERIA
import PDFDocument from 'pdfkit'; // PDFKIT LIBRERÍA

const app = express();
app.use(express.json());

// Función para validar los datos de una película
const validateMovie = (movie) => {
    const schema = Joi.object({
        title: Joi.string().min(1).max(255).required(),
        director: Joi.string().min(3).max(255).required(),
        release_year: Joi.number().integer().min(1888).max(new Date().getFullYear()).required(),
        genre: Joi.string().min(3).max(50).required(),
        rating: Joi.number().min(0).max(10).required(),
        duration_minutes: Joi.number().integer().min(1).required(),
        language: Joi.string().min(2).max(50).required(),
    });
    return schema.validate(movie);
};

// Middleware global
app.use((req, res, next) => {
    console.log('Middleware activado');
    next();
});

// GET para obtener TODAS las películas
app.get('/movies', (req, res) => {
    const movies = read(); // Leer todas las películas
    res.json(movies);
});

// POST para agregar una nueva película
app.post('/movies',
    (req, res, next) => {
        console.log('Middleware POST');
        next();
    },
    (req, res) => {
        const { error } = validateMovie(req.body); // Validar datos de la película
        if (error) return res.status(400).json({ message: error.details[0].message });

        const movies = read();
        const movie = {
            ...req.body,
            id: movies.length + 1 // Asignar ID único
        };

        movies.push(movie); // Añadir nueva película
        write(movies);

        // Código HTTP 201 CREATED
        res.status(201).json(movie);
    }
);

// GET para obtener una película por ID
app.get('/movies/:id', (req, res) => {
    const movies = read();
    const movie = movies.find(movie => movie.id === parseInt(req.params.id));
    if (movie) {
        res.json(movie);
    } else {
        res.status(404).json({ message: 'Película no encontrada' });
    }
});

// PUT para actualizar una película
app.put('/movies/:id', (req, res) => {
    const { error } = validateMovie(req.body); // Validar los datos antes de actualizar
    if (error) return res.status(400).json({ message: error.details[0].message });

    const movies = read();
    let movie = movies.find(movie => movie.id === parseInt(req.params.id));
    if (movie) {
        movie = {
            ...movie,
            ...req.body
        };

        // Actualizar la película en el array
        movies[
            movies.findIndex(m => m.id === parseInt(req.params.id))
        ] = movie;

        write(movies);
        res.json(movie);
    } else {
        res.status(404).json({ message: 'Película no encontrada' });
    }
});

// DELETE para eliminar una película por ID
app.delete('/movies/:id', (req, res) => {
    const movies = read();
    const movie = movies.find(movie => movie.id === parseInt(req.params.id));
    if (movie) {
        movies.splice(
            movies.findIndex(movie => movie.id === parseInt(req.params.id)),
            1
        );
        write(movies);
        res.json(movie);
    } else {
        res.status(404).json({ message: 'Película no encontrada' });
    }
});

//GET para generar PDF por ID

app.get('/movies/:id/pdf', (req, res) => {
    const movies = read();
    const movie = movies.find(movie => movie.id === parseInt(req.params.id));

    if (!movie) {
        return res.status(404).json({ message: 'Película no encontrada' });
    }

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=movie_${movie.id}.pdf`);

    // Escribir el contenido del PDF
    doc.text(`Película ID: ${movie.id}`);
    doc.text(`Título: ${movie.title}`);
    doc.text(`Director: ${movie.director}`);
    doc.text(`Año de lanzamiento: ${movie.release_year}`);
    doc.text(`Género: ${movie.genre}`);
    doc.text(`Calificación: ${movie.rating}`);
    doc.text(`Duración (minutos): ${movie.duration_minutes}`);
    doc.text(`Idioma: ${movie.language}`);

   
    doc.pipe(res);
    doc.end();
});

// Iniciar servidor
app.listen(3200, () => {
    console.log('Servidor ejecutándose en el puerto 3200');
});
