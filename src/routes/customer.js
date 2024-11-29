const express=require('express');
const router=express.Router();

//controlador
const customerController = require('../controllers/customerController');

function isAuthenticated(req, res, next) {
    const publicPaths = ['/login', '/register', '/logout']; 
    if (publicPaths.includes(req.path)) {
        return next(); 
    }

    if (req.session && req.session.user) {
        return next(); 
    }

    res.redirect('/login'); 
}

router.get('/register', customerController.register);
router.post('/register', customerController.registerUser);
router.get('/login', customerController.login);
router.post('/login', customerController.loginUser);

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/login'); 
    });
});

router.use(isAuthenticated);

router.get('/list',customerController.list);
router.post('/add', customerController.save);
router.get('/delete/:id', customerController.delete);
router.get('/update/:id', customerController.edit);
router.post('/update/:id', customerController.update);

router.get('/api/customers/:id', customerController.updateUser);

module.exports=router;

