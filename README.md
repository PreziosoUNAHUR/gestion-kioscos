# Kiosco Manager

## 📱 Aplicación de Gestión de Kiosco

Una aplicación completa para la gestión de un kiosco, con funcionalidades de ventas, inventario, proveedores, clientes y estadísticas.

### 📋 Descripción general

Esta aplicación está construida con **Expo Router** (rutas basadas en archivos) y **React Native**, con una arquitectura que separa claramente la lógica de negocio de la presentación visual.

### 🛠️ Características Principales

- **🛒 Carrito de Ventas**: Ventas manuales y por código de barras
- **📦 Inventario**: Búsqueda y lista de productos con stock
- **💰 Cierre de Caja**: Registro de billetes, Cuenta DNI y Mercado Pago
- **📊 Estadísticas**: KPIs semanales y mensuales con gráficos
- **👥 Clientes**: Sistema de fiado (crédito/a favor)
- **👥 Proveedores**: Gestión de proveedores con WhatsApp integration
- **📈 Reportes**: Exportación a CSV y Email

### 📱 Pantallas Principales

| Pantalla | Descripción |
|----------|-------------|
| **Home** | Buscador inteligente + 2 botones principales (Venta, Agregar Stock) |
| **Inventario** | Lista completa de productos con búsqueda y stock bajo |
| **Caja** | Total facturado, historial de ventas, reportes |
| **Estadísticas** | KPIs, gráficos semanal y por categorías |
| **Venta Manual** | Seleccionar productos con cantidades |
| **Venta por Barras** | Ingresar código y confirmar venta |
| **Nueva Carga** | Cámara + formulario para agregar productos |
| **Gestor de Proveedores** | Lista con WhatsApp integration |
| **Clientes (Fiado)** | Deuda management con sistema de a favor |

### 📦 Dependencias Instaladas

#### Librerías Críticas

| Librería | Propósito |
|----------|-----------|
| `expo-sqlite` | Base de datos SQLite local. Persistencia de datos entre sesiones. Usado para Productos, Ventas, Clientes y Proveedores. |
| `expo-image-picker` | Acceso a la cámara y galería para tomar fotos de productos. |
| `expo-mail-composer` | Envío de emails con reportes de ventas, estadísticas y detalles de caja. |
| `victory-native` + `@shopify/react-native-skia` | Gráficos y charts para la pantalla de Estadísticas (barras, pastel). Victoria tiene 367K descargas/semana. |
| `react-native-paper` | Componentes de UI profesionales (Buttons, Cards, Dialogs, Portal) con tema Material Design. |

| Librería | Propósito |
|----------|-----------|
| `react-native-gesture-handler` | Gestos táctiles nativos (swipes, pans). |
| `react-native-reanimated` | Animaciones fluidas (animación 'shift' entre pestañas). |
| `@shopify/react-native-skia` | Motor de renderizado Skia para gráficos vectoriales de alta performance. |

#### Librerías de UI y Navegación

| Librería | Propósito |
|----------|-----------|
| `react-native-paper` | Componentes de UI profesionales (Buttons, Cards, Dialogs, Portal) con tema Material Design. |
| `@react-navigation/native` | Navegación base entre pantallas. |
| `@react-navigation/bottom-tabs` | Barra de tabs inferior con animación 'shift'. |
| `@react-navigation/native-stack` | Navegación tipo stack para pantallas completas. |
| `expo-router` | Enrutamiento basado en archivos (app/(tabs)/index.tsx). |

#### Utilerías y Helpers

| Librería | Propósito |
|----------|-----------|
| `expo-font` | Carga de fuentes personalizadas. |
| `expo-status-bar` | Gestión de la barra de estado del sistema. |
| `react-native-vector-icons` | Conjunto de íconos para la interfaz. |
| ` Linking` | Apertura de URLs externas (WhatsApp, email, maps). |

### 🏗️ Estructura del Proyecto

```
/app                    # Rutas y pantallas (Expo Router)
/app/(tabs)/           # Pestañas inferiores (Home, Acciones, Estadísticas)
/app/(tabs)/_layout.tsx # Configuración de tabs con animación 'shift'
/app/(tabs)/index.tsx   # Pantalla Home con buscador en vivo
/app/(tabs)/acciones.tsx # Pantalla de acciones (Cierre, Proveedores, Clientes)
/app/(tabs)/estadisticas.tsx # Pantalla de estadísticas con gráficos
/app/(tabs)/inventario.tsx # Pantalla de inventario con FlatList

/app/venta-manual.tsx   # Venta manual con steppers
/app/venta-barras.tsx   # Venta por código de barras
/app/agregar-stock.tsx  # Agregar stock (manual o lector)
/app/agregar-lector.tsx # Lector de códigos para agregar stock
/app/clientes.tsx       # Gestión de clientes con fiado
/app/proveedores.tsx    # Gestión de proveedores con WhatsApp

/lib/db.ts              # Capa de datos SQLite (init, CRUD para todas tablas)
/app/caja.tsx           # Pantalla de caja con total y historial
/app/estadisticas.tsx   # Pantalla de estadísticas con gráficos

```

### 🚀 Scripts Disponibles

```bash
npm install          # Instalar dependencias
npx expo start       # Iniciar servidor de desarrollo
npx expo start --web # Versión web
npx expo reset       # Resetear el proyecto
npm run lint         # Linting de código
```


Desarrollado por Franco1 usando Expo y React Native.
