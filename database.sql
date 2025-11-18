-- This script is designed for a PostgreSQL database.

-- Drop existing tables in reverse order of dependency to avoid foreign key constraints.
DROP TABLE IF EXISTS product_categories;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS subscribers;

-- Create the products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL,
    images TEXT[] NOT NULL,
    stock INT NOT NULL,
    featured BOOLEAN DEFAULT FALSE,
    ai_hint VARCHAR(255),
    discount_percentage DECIMAL(5, 2),
    offer_start_date TIMESTAMP,
    offer_end_date TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the categories table with support for subcategories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL, -- Allows nesting
    UNIQUE(name, parent_id)
);

-- Create the join table for the many-to-many relationship between products and categories
CREATE TABLE product_categories (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Create the coupons table
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    expiry_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    items JSONB NOT NULL,
    coupon_code VARCHAR(50),
    discount_amount DECIMAL(10, 2),
    shipping_address VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the subscribers table
CREATE TABLE subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_products_featured ON products (featured);
CREATE INDEX idx_categories_parent_id ON categories (parent_id);
CREATE INDEX idx_product_categories_product_id ON product_categories (product_id);
CREATE INDEX idx_product_categories_category_id ON product_categories (category_id);
CREATE INDEX idx_coupons_code ON coupons (code);
CREATE INDEX idx_orders_customer_email ON orders (customer_email);
CREATE INDEX idx_orders_status ON orders (status);


-- Populate the categories table with hierarchical data
INSERT INTO categories (id, name, parent_id) VALUES
(1, 'Perfumes', NULL),
(2, 'Cuidado de Piel', NULL),
(3, 'Joyas', NULL),
(4, 'Accesorios', NULL),
(5, 'Por Marca', 1),
(6, 'Perfumes Nicho', 1),
(7, 'Perfumes Árabes', 1),
(8, 'Por Género', 1),
(101, 'Lancôme', 5),
(102, 'L''Occitane', 5),
(103, 'Dior', 5),
(104, 'Chanel', 5),
(105, 'Gucci', 5),
(106, 'Tom Ford', 5),
(107, 'Creed', 5),
(108, 'Jo Malone', 5),
(201, 'Hombre', 8),
(202, 'Mujer', 8),
(203, 'Unisex', 8),
(301, 'Rostro', 2),
(302, 'Cuerpo', 2),
(303, 'Protectores Solares', 2),
(401, 'Anillos', 3),
(402, 'Collares', 3),
(403, 'Pulseras', 3),
(404, 'Aros', 3);

-- Manually set the sequence for categories since we're inserting specific IDs
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));


-- Populate the products table with 20 sample products
INSERT INTO products (id, name, description, short_description, price, images, stock, featured, ai_hint, discount_percentage, offer_start_date, offer_end_date) VALUES
(1, 'Lancôme La Vie Est Belle', 'Una declaración universal a la belleza de la vida. Una firma olfativa única, encapsulada en el aroma de este perfume dulce que representa una declaración de felicidad.', 'Eau de Parfum - Floral Frutal.', 75000, '{"https://farma365.com.ar/wp-content/uploads/2024/04/3348901486392-3.webp"}', 15, true, 'luxury perfume bottle', 10, '2024-05-01', '2024-12-31'),
(2, 'L''Occitane Karité Crema de Manos', 'Enriquecida con un 20% de manteca de karité orgánica, esta crema de manos se absorbe rápidamente, dejando las manos suaves, nutridas y protegidas.', 'Crema de manos ultra nutritiva.', 25000, '{"https://es.loccitane.com/dw/image/v2/BCMK_PRD/on/demandware.static/-/Sites-occ_master/default/dw15340f10/packshots/01MA150K23_A.jpg?sw=400&sh=400"}', 8, true, 'hand cream tube', NULL, NULL, NULL),
(3, 'Dior Sauvage Elixir', 'Un licor con una estela embriagadora, compuesto por ingredientes excepcionales. Un corazón de especias, una esencia de lavanda ''a medida'' y una mezcla de maderas licorosas.', 'Perfume masculino concentrado.', 120000, '{"https://acdn-us.mitiendanube.com/stores/001/071/596/products/snapinsta-app_457143249_18272561446241493_4114811689171539800_n_1080-copia-4c107f322e0631e79017304658593813-240-0.jpg"}', 12, true, 'dark perfume bottle', NULL, NULL, NULL),
(4, 'Pulsera de Plata con Dije de Corazón', 'Una pulsera de plata de ley 925 con un diseño de cadena fina y un delicado dije de corazón, perfecta para un regalo o para el uso diario.', 'Pulsera de plata 925.', 45000, '{"https://holiclothing.com.ar/wp-content/uploads/2023/10/WhatsApp-Image-2022-07-13-at-7.49.03-PM-1.jpeg"}', 25, false, 'silver bracelet heart', NULL, NULL, NULL),
(5, 'Reloj Clásico de Cuero', 'Reloj analógico con movimiento de cuarzo, caja de acero inoxidable y correa de cuero genuino. Un diseño atemporal para cualquier ocasión.', 'Diseño atemporal para cualquier ocasión', 85000, '{"https://imgur.com/eBq6AMg.png"}', 0, true, 'classic leather watch', NULL, NULL, NULL),
(6, 'Aros de Oro 18k', 'Pequeños aros de oro de 18 quilates con un diseño minimalista y elegante, ideales para el uso diario y para combinar con otras joyas.', 'Aros de oro minimalistas.', 60000, '{"https://imgur.com/vHqB5oW.png"}', 20, false, 'gold earrings', NULL, NULL, NULL),
(7, 'Chanel Nº5', 'El perfume por excelencia. Un bouquet floral aldehído, una composición intemporal y legendaria.', 'El icónico perfume femenino.', 115000, '{"https://hips.hearstapps.com/hmg-prod/images/chanel-n-5-1552904574.jpg"}', 10, false, 'classic perfume bottle', NULL, NULL, NULL),
(8, 'Sérum Hidratante con Ácido Hialurónico', 'Un sérum ligero que proporciona una hidratación intensa y duradera para una piel suave y flexible.', 'Sérum facial de hidratación profunda.', 35000, '{"https://imgur.com/xVwDODZ.png"}', 30, false, 'skincare serum bottle', NULL, NULL, NULL),
(9, 'Collar de Perlas Cultivadas', 'Un collar clásico de perlas cultivadas de agua dulce, anudadas a mano con un broche de plata.', 'Collar de perlas clásico.', 95000, '{"https://imgur.com/gY5zP8W.png"}', 8, true, 'pearl necklace', NULL, NULL, NULL),
(10, 'Gafas de Sol Estilo Aviador', 'Gafas de sol unisex con montura metálica y lentes polarizadas con protección UV400.', 'Gafas de sol clásicas.', 30000, '{"https://imgur.com/uTjZ0eR.png"}', 40, false, 'aviator sunglasses', 15, '2024-06-01', '2024-08-31'),
(11, 'Anillo de Compromiso Solitario', 'Anillo de oro blanco de 14k con un diamante de corte brillante de 0.5 quilates.', 'Anillo de diamante solitario.', 250000, '{"https://imgur.com/a9rDTEK.png"}', 3, false, 'diamond ring', NULL, NULL, NULL),
(12, 'Gucci Bloom', 'Una fragancia que captura el espíritu de la mujer contemporánea, diversa y auténtica.', 'Eau de Parfum floral.', 98000, '{"https://www.lancome.cl/dw/image/v2/BCSH_PRD/on/demandware.static/-/Sites-lancome-master-catalog/default/dw73351b6d/images/3614271663116_LaVieEstBelle_EDP_50ml_pdp_img.jpg?sw=650&sh=650&sm=fit&q=70"}', 18, false, 'pink perfume bottle', NULL, NULL, NULL),
(13, 'Protector Solar FPS 50+', 'Protector solar de amplio espectro con una textura ligera y no grasa, resistente al agua.', 'Protector solar facial y corporal.', 22000, '{"https://imgur.com/R3I0aKu.png"}', 50, false, 'sunscreen bottle', NULL, NULL, NULL),
(14, 'Pañuelo de Seda Estampado', 'Un pañuelo de seda 100% natural con un vibrante estampado floral, perfecto para el cuello o como accesorio para el bolso.', 'Pañuelo de seda natural.', 28000, '{"https://imgur.com/kP8zY4T.png"}', 22, true, 'silk scarf pattern', NULL, NULL, NULL),
(15, 'Tom Ford Tobacco Vanille', 'Una opulenta fragancia artesanal con tabaco especiado y vainilla cremosa. Lujosa, cálida y emblemática.', 'Perfume unisex de lujo.', 180000, '{"https://tascani.vtexassets.com/arquivos/ids/182034-800-auto?v=638635608787130000&width=800&height=auto&aspect=true"}', 7, true, 'dark luxury perfume', NULL, NULL, NULL),
(16, 'Mascarilla Facial de Arcilla', 'Mascarilla purificante con arcilla verde y aceite de árbol de té para limpiar los poros en profundidad.', 'Mascarilla facial purificante.', 18000, '{"https://imgur.com/qF0k3hY.png"}', 35, false, 'clay face mask jar', NULL, NULL, NULL),
(17, 'Creed Aventus', 'Una fragancia audaz y contemporánea que celebra la fuerza, el poder, el éxito y la herencia.', 'Eau de Parfum para hombre.', 210000, '{"https://placehold.co/600x600.png"}', 5, true, 'luxury mens perfume', NULL, NULL, NULL),
(18, 'Jo Malone English Pear & Freesia', 'La esencia del otoño. Peras recién maduras envueltas en un ramo de fresias blancas y suavizadas por ámbar, pachulí y maderas.', 'Colonia fresca y afrutada.', 88000, '{"https://placehold.co/600x600.png"}', 14, false, 'cologne bottle minimalist', NULL, NULL, NULL),
(19, 'Lattafa Asad', 'Un perfume árabe con notas de pimienta negra, tabaco y vainilla. Una fragancia intensa y duradera.', 'Eau de Parfum Árabe.', 40000, '{"https://placehold.co/600x600.png"}', 25, false, 'arabic perfume bottle', NULL, NULL, NULL),
(20, 'Anillo de Plata y Ónix', 'Un anillo de plata 925 con una piedra de ónix negro central. Diseño moderno y audaz.', 'Anillo de plata con ónix.', 52000, '{"https://placehold.co/600x600.png"}', 18, false, 'silver onyx ring', NULL, NULL, NULL);

-- Manually set the sequence for products since we're inserting specific IDs
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- Populate the product_categories join table
INSERT INTO product_categories (product_id, category_id) VALUES
(1, 1), (1, 8), (1, 202), (1, 101),
(2, 2), (2, 302), (2, 102),
(3, 1), (3, 8), (3, 201), (3, 103),
(4, 3), (4, 403),
(5, 4),
(6, 3), (6, 404),
(7, 1), (7, 8), (7, 202), (7, 104),
(8, 2), (8, 301),
(9, 3), (9, 402),
(10, 4),
(11, 3), (11, 401),
(12, 1), (12, 8), (12, 202), (12, 105),
(13, 2), (13, 303),
(14, 4),
(15, 1), (15, 6), (15, 8), (15, 203), (15, 106),
(16, 2), (16, 301),
(17, 1), (17, 6), (17, 8), (17, 201), (17, 107),
(18, 1), (18, 5), (18, 8), (18, 202), (18, 108),
(19, 1), (19, 7),
(20, 3), (20, 401);

-- Populate the coupons table
INSERT INTO coupons (id, code, discount_type, discount_value, expiry_date, is_active) VALUES
(1, 'VERANO20', 'percentage', 20, '2024-12-31', true),
(2, 'BIENVENIDO', 'fixed', 5000, NULL, true),
(3, 'EXPIRADO', 'percentage', 10, '2023-01-01', true),
(4, 'INACTIVO', 'fixed', 50, NULL, false);

-- Manually set the sequence for coupons since we're inserting specific IDs
SELECT setval('coupons_id_seq', (SELECT MAX(id) FROM coupons));

-- End of script
