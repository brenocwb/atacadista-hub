-- Popular banco com produtos de demonstração
-- Inserir produtos de demonstração (verificando se as categorias existem)
INSERT INTO public.products (name, description, base_price, category_id, sku, images, is_active) VALUES
-- Roupas Femininas
('Blusa Estampada Floral', 'Blusa feminina com estampa floral delicada, tecido leve e confortável', 45.90, (SELECT id FROM product_categories WHERE name = 'Bolsas' LIMIT 1), 'BLF001', ARRAY['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400'], true),
('Vestido Midi Liso', 'Vestido midi em tecido crepe, ideal para ocasiões especiais', 89.90, (SELECT id FROM product_categories WHERE name = 'Bolsas' LIMIT 1), 'VMD001', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400'], true),
('Saia Plissada', 'Saia plissada em tecido acetinado, super versátil', 52.90, (SELECT id FROM product_categories WHERE name = 'Bolsas' LIMIT 1), 'SPL001', ARRAY['https://images.unsplash.com/photo-1583496661160-fb5886a13d24?w=400'], true),

-- Roupas Masculinas  
('Camisa Social Slim', 'Camisa social masculina corte slim, tecido anti-rugas', 79.90, (SELECT id FROM product_categories WHERE name = 'Jeans' LIMIT 1), 'CSS001', ARRAY['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400'], true),
('Polo Básica', 'Polo masculina em piquet, disponível em várias cores', 39.90, (SELECT id FROM product_categories WHERE name = 'Jeans' LIMIT 1), 'PBM001', ARRAY['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400'], true),
('Bermuda Sarja', 'Bermuda masculina em sarja, perfeita para o verão', 59.90, (SELECT id FROM product_categories WHERE name = 'Jeans' LIMIT 1), 'BSM001', ARRAY['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400'], true),

-- Calçados
('Tênis Casual Branco', 'Tênis casual unissex, super confortável para o dia a dia', 129.90, (SELECT id FROM product_categories WHERE name = 'Esportivos' LIMIT 1), 'TCB001', ARRAY['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'], true),
('Sandália Rasteira', 'Sandália rasteira feminina em couro legítimo', 49.90, (SELECT id FROM product_categories WHERE name = 'Esportivos' LIMIT 1), 'SRF001', ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400'], true),
('Sapato Social Preto', 'Sapato social masculino em couro, ideal para trabalho', 159.90, (SELECT id FROM product_categories WHERE name = 'Esportivos' LIMIT 1), 'SSP001', ARRAY['https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400'], true),

-- Acessórios
('Óculos de Sol', 'Óculos de sol unissex com proteção UV400', 89.90, (SELECT id FROM product_categories WHERE name = 'Infantil' LIMIT 1), 'OCS001', ARRAY['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'], true),
('Relógio Digital', 'Relógio digital esportivo à prova d''água', 99.90, (SELECT id FROM product_categories WHERE name = 'Infantil' LIMIT 1), 'RLD001', ARRAY['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400'], true),
('Cinto de Couro', 'Cinto masculino em couro legítimo com fivela clássica', 69.90, (SELECT id FROM product_categories WHERE name = 'Infantil' LIMIT 1), 'CCL001', ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'], true),

-- Bolsas
('Bolsa Tiracolo', 'Bolsa tiracolo feminina em couro sintético', 79.90, (SELECT id FROM product_categories WHERE name = 'Bolsas' LIMIT 1), 'BTF001', ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'], true),
('Carteira Feminina', 'Carteira feminina com vários compartimentos', 29.90, (SELECT id FROM product_categories WHERE name = 'Bolsas' LIMIT 1), 'CAF001', ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'], true),
('Mochila Escolar', 'Mochila resistente para uso diário', 89.90, (SELECT id FROM product_categories WHERE name = 'Bolsas' LIMIT 1), 'MOE001', ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'], true),

-- Jeans
('Calça Jeans Skinny', 'Calça jeans feminina modelo skinny, super confortável', 79.90, (SELECT id FROM product_categories WHERE name = 'Jeans' LIMIT 1), 'CJS001', ARRAY['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400'], true),
('Jeans Masculino Reto', 'Calça jeans masculina corte reto clássico', 89.90, (SELECT id FROM product_categories WHERE name = 'Jeans' LIMIT 1), 'JMR001', ARRAY['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400'], true),
('Jaqueta Jeans', 'Jaqueta jeans unissex, peça coringa do guarda-roupa', 99.90, (SELECT id FROM product_categories WHERE name = 'Jeans' LIMIT 1), 'JAJ001', ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'], true),

-- Esportivos
('Conjunto Esportivo', 'Conjunto feminino para academia com top e legging', 69.90, (SELECT id FROM product_categories WHERE name = 'Esportivos' LIMIT 1), 'CEF001', ARRAY['https://images.unsplash.com/photo-1506629905607-21523d48ba29?w=400'], true),
('Shorts Esportivo', 'Shorts masculino para corrida com tecido dry-fit', 34.90, (SELECT id FROM product_categories WHERE name = 'Esportivos' LIMIT 1), 'SEM001', ARRAY['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400'], true),

-- Infantil
('Conjunto Infantil', 'Conjunto infantil unissex com estampa divertida', 39.90, (SELECT id FROM product_categories WHERE name = 'Infantil' LIMIT 1), 'CIN001', ARRAY['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400'], true);

-- Adicionar coluna stock_quantity na tabela products para produtos sem variantes
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0;

-- Inserir variantes para alguns produtos
INSERT INTO public.product_variants (product_id, size, color, additional_price, stock_quantity, is_active) VALUES
-- Blusa Estampada Floral
((SELECT id FROM products WHERE sku = 'BLF001'), 'P', 'Rosa', 0.00, 25, true),
((SELECT id FROM products WHERE sku = 'BLF001'), 'M', 'Rosa', 0.00, 30, true),
((SELECT id FROM products WHERE sku = 'BLF001'), 'G', 'Rosa', 0.00, 20, true),
((SELECT id FROM products WHERE sku = 'BLF001'), 'P', 'Azul', 0.00, 15, true),
((SELECT id FROM products WHERE sku = 'BLF001'), 'M', 'Azul', 0.00, 25, true),
((SELECT id FROM products WHERE sku = 'BLF001'), 'G', 'Azul', 0.00, 18, true),

-- Vestido Midi Liso
((SELECT id FROM products WHERE sku = 'VMD001'), 'P', 'Preto', 0.00, 12, true),
((SELECT id FROM products WHERE sku = 'VMD001'), 'M', 'Preto', 0.00, 18, true),
((SELECT id FROM products WHERE sku = 'VMD001'), 'G', 'Preto', 0.00, 15, true),
((SELECT id FROM products WHERE sku = 'VMD001'), 'P', 'Vinho', 5.00, 8, true),
((SELECT id FROM products WHERE sku = 'VMD001'), 'M', 'Vinho', 5.00, 12, true),
((SELECT id FROM products WHERE sku = 'VMD001'), 'G', 'Vinho', 5.00, 10, true),

-- Tênis Casual Branco
((SELECT id FROM products WHERE sku = 'TCB001'), '36', 'Branco', 0.00, 5, true),
((SELECT id FROM products WHERE sku = 'TCB001'), '37', 'Branco', 0.00, 8, true),
((SELECT id FROM products WHERE sku = 'TCB001'), '38', 'Branco', 0.00, 12, true),
((SELECT id FROM products WHERE sku = 'TCB001'), '39', 'Branco', 0.00, 15, true),
((SELECT id FROM products WHERE sku = 'TCB001'), '40', 'Branco', 0.00, 12, true),
((SELECT id FROM products WHERE sku = 'TCB001'), '41', 'Branco', 0.00, 8, true),
((SELECT id FROM products WHERE sku = 'TCB001'), '42', 'Branco', 0.00, 6, true),

-- Camisa Social Slim
((SELECT id FROM products WHERE sku = 'CSS001'), 'P', 'Branco', 0.00, 20, true),
((SELECT id FROM products WHERE sku = 'CSS001'), 'M', 'Branco', 0.00, 25, true),
((SELECT id FROM products WHERE sku = 'CSS001'), 'G', 'Branco', 0.00, 22, true),
((SELECT id FROM products WHERE sku = 'CSS001'), 'GG', 'Branco', 2.00, 15, true),
((SELECT id FROM products WHERE sku = 'CSS001'), 'P', 'Azul Claro', 0.00, 18, true),
((SELECT id FROM products WHERE sku = 'CSS001'), 'M', 'Azul Claro', 0.00, 22, true),
((SELECT id FROM products WHERE sku = 'CSS001'), 'G', 'Azul Claro', 0.00, 20, true),
((SELECT id FROM products WHERE sku = 'CSS001'), 'GG', 'Azul Claro', 2.00, 12, true),

-- Polo Básica
((SELECT id FROM products WHERE sku = 'PBM001'), 'P', 'Preto', 0.00, 30, true),
((SELECT id FROM products WHERE sku = 'PBM001'), 'M', 'Preto', 0.00, 35, true),
((SELECT id FROM products WHERE sku = 'PBM001'), 'G', 'Preto', 0.00, 28, true),
((SELECT id FROM products WHERE sku = 'PBM001'), 'P', 'Marinho', 0.00, 25, true),
((SELECT id FROM products WHERE sku = 'PBM001'), 'M', 'Marinho', 0.00, 30, true),
((SELECT id FROM products WHERE sku = 'PBM001'), 'G', 'Marinho', 0.00, 22, true),
((SELECT id FROM products WHERE sku = 'PBM001'), 'P', 'Cinza', 0.00, 20, true),
((SELECT id FROM products WHERE sku = 'PBM001'), 'M', 'Cinza', 0.00, 25, true),
((SELECT id FROM products WHERE sku = 'PBM001'), 'G', 'Cinza', 0.00, 18, true),

-- Calça Jeans Skinny
((SELECT id FROM products WHERE sku = 'CJS001'), '36', 'Azul Escuro', 0.00, 15, true),
((SELECT id FROM products WHERE sku = 'CJS001'), '38', 'Azul Escuro', 0.00, 20, true),
((SELECT id FROM products WHERE sku = 'CJS001'), '40', 'Azul Escuro', 0.00, 18, true),
((SELECT id FROM products WHERE sku = 'CJS001'), '42', 'Azul Escuro', 0.00, 12, true),
((SELECT id FROM products WHERE sku = 'CJS001'), '44', 'Azul Escuro', 0.00, 8, true),
((SELECT id FROM products WHERE sku = 'CJS001'), '36', 'Preto', 3.00, 12, true),
((SELECT id FROM products WHERE sku = 'CJS001'), '38', 'Preto', 3.00, 15, true),
((SELECT id FROM products WHERE sku = 'CJS001'), '40', 'Preto', 3.00, 14, true),
((SELECT id FROM products WHERE sku = 'CJS001'), '42', 'Preto', 3.00, 10, true);

-- Atualizar estoque dos produtos sem variantes
UPDATE public.products SET stock_quantity = 50 WHERE sku IN ('SPL001', 'BSM001', 'SRF001', 'SSP001', 'OCS001', 'RLD001', 'CCL001', 'BTF001', 'CAF001', 'MOE001', 'JMR001', 'JAJ001', 'CEF001', 'SEM001', 'CIN001');