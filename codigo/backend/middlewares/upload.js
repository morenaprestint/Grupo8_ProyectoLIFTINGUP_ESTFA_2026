const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que la carpeta de subidas exista físicamente
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'perfil-' + (req.params.id || 'new') + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro estricto para aceptar exclusivamente formatos PNG y JPEG/JPG
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png'];
    const allowedMimetypes = ['image/jpeg', 'image/png', 'image/jpg'];

    const extnameValido = allowedExts.includes(ext);
    const mimetypeValido = allowedMimetypes.includes(file.mimetype.toLowerCase());

    if (extnameValido && mimetypeValido) {
        return cb(null, true);
    } else {
        cb(new Error('Formato no permitido. La foto de perfil debe ser estrictamente en formato PNG o JPEG/JPG.'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5 MB
    fileFilter: fileFilter
});

module.exports = upload;