const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const controller = {};

controller.list = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.status(500).send('Error de conexión');
        conn.query('SELECT * FROM customer', (err, customers) => {
            if (err) return res.status(500).send('Error al obtener datos');
            res.render('customers', { data: customers }); 
        });
    });
};


controller.save = (req, res) => {
    const data = req.body;

    req.getConnection((err, conn) => {
        conn.query('INSERT INTO customer set ?', [data], (err, customer) => {
            res.redirect('/list');
        });
    })
}

controller.edit = (req, res) => {
    const { id } = req.params;
    req.getConnection((err, conn) => {
        conn.query('SELECT * FROM customer WHERE id = ?', [id], (err, customer) => {
            if (err) return res.status(500).send('Error al cargar los datos');
            res.render('customer-edit', { 
                data: customer[0] 
            });
        });
    });
};

controller.updateUser = (req, res) => {
    const { id } = req.params;
    req.getConnection((err, conn) => {
        if (err) return res.status(500).send(err);
        conn.query('SELECT * FROM customer WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).send(err);
            if (results.length === 0) {
                return res.status(404).send({ message: 'Cliente no encontrado' });
            }
            res.json(results[0]); 
        });
    });
}

controller.register = (req, res) => {
    res.render('register');
};

controller.registerUser = (req, res) => {
    const { username, password, password_confirm } = req.body;

    // Validaciones del servidor
    if (!username || !password || !password_confirm) {
        return res.status(400).render('register', { errorMessage: 'Todos los campos son obligatorios.' });
    }
    if (password !== password_confirm) {
        return res.status(400).render('register', { errorMessage: 'Las contraseñas no coinciden.' });
    }
    if (password.length < 8) {
        return res.status(400).render('register', { errorMessage: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    req.getConnection((err, conn) => {
        if (err) return res.status(500).render('register', { errorMessage: 'Error al conectarse a la base de datos.' });

        conn.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) return res.status(500).render('register', { errorMessage: 'Error al verificar el correo.' });
            if (results.length > 0) {
                return res.status(400).render('register', { errorMessage: 'El correo ya está registrado.' });
            }

            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                conn.query('INSERT INTO users (username, password, registered_at) VALUES (?, ?, NOW())', [username, hashedPassword], (err, result) => {
                    if (err) return res.status(500).render('register', { errorMessage: 'Error al registrar el usuario.' });

                    req.session.user = { id: result.insertId, username }; 
                    
                    res.redirect('/list');
                });
            } catch (error) {
                res.status(500).render('register', { errorMessage: 'Error al procesar la contraseña.' });
            }
        });
    });
};

controller.login = (req, res) => {
    res.render('login');
};

controller.loginUser = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).render('login', { errorMessage: 'Por favor, complete todos los campos.' });
    }

    req.getConnection((err, conn) => {
        if (err) return res.status(500).render('login', { errorMessage: 'Error de conexión con la base de datos.' });

        conn.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) return res.status(500).render('login', { errorMessage: 'Error al buscar el usuario.' });
            if (results.length === 0) {
                return res.status(401).render('login', { errorMessage: 'Usuario o contraseña incorrectos.' });
            }

            const user = results[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(401).render('login', { errorMessage: 'Contraseña incorrecta.' });
            }

            req.session.user = { id: user.id, username: user.username };
            res.redirect('/list'); // Redirige al dashboard
        });
    });
};

controller.update = (req, res) => {
    const { id } = req.params;
    const { name, address, phone } = req.body;
    req.getConnection((err, conn) => {
        if (err) return res.status(500).send(err);
        conn.query(
            'UPDATE customer SET name = ?, address = ?, phone = ? WHERE id = ?',
            [name, address, phone, id],
            (err, result) => {
                if (err) return res.status(500).send(err);
                res.redirect('/list'); 
            }
        );
    });
};

controller.delete = (req, res) => {
    const {id} = req.params;

    req.getConnection((err, conn) => {
        conn.query('DELETE FROM customer WHERE id = ?', [id], (err, rows) => {
            res.redirect('/list');
        });
    })
}

controller.complaint = (req, res) => {
    res.render('complaint');
}

controller.submitComplaint = async (req, res) => {
    const { name, email, complaint } = req.body;

    // Configuración de Nodemailer con Mailtrap
    const transporter = nodemailer.createTransport({
        host: 'sandbox.smtp.mailtrap.io', 
        port: 2525, 
        auth: {
            user: 'a3cd15ebc44564', 
            pass: '0a11ca4b325fa0', 
        },
    });

    const mailOptions = {
        from: email, 
        to: email, 
        subject: 'Nueva Queja Recibida',
        text: `Has recibido una nueva queja:

        Nombre: ${name}
        Correo: ${email}
        Queja: ${complaint}
        Fecha: ${new Date().toLocaleString()}` // Formato legible para la fecha
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Correo enviado exitosamente' });
    } catch (error) {
        console.error('Error al enviar la queja:', error);
        res.status(500).json({ message: 'Error al enviar la queja' });
    }
};

module.exports = controller;
