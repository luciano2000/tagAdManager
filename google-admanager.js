// Google AdManager - Script Simplificado
// Versão 1.0.0

/**
 * Configuração do AdManager
 * @typedef {Object} AdManagerConfig
 * @property {string} networkCode - Código da rede do Google AdManager
 * @property {string} adUnitPath - Caminho da unidade de anúncio
 * @property {boolean} [collapseEmptyDivs=true] - Colapsar divs vazias
 * @property {boolean} [enableSingleRequest=true] - Habilitar requisição única
 * @property {boolean} [disableInitialLoad=false] - Desabilitar carregamento inicial
 */

/**
 * Tamanho de anúncio
 * @typedef {Object} AdSize
 * @property {number} width - Largura do anúncio
 * @property {number} height - Altura do anúncio
 */

/**
 * Mapeamento de tamanhos responsivos
 * @typedef {Object} AdSizeMapping
 * @property {number[]} viewport - [largura, altura] da viewport
 * @property {AdSize[]} sizes - Tamanhos de anúncios para esta viewport
 */

/**
 * Configuração de slot de anúncio
 * @typedef {Object} AdSlotConfig
 * @property {string} id - ID do slot
 * @property {AdSize[]} sizes - Tamanhos do anúncio
 * @property {AdSizeMapping[]} [sizeMapping] - Mapeamento de tamanhos responsivos
 * @property {Object<string, string|string[]>} [targeting] - Targeting do anúncio
 */

(function(window, document) {
  'use strict';

  // Namespace global
  window.GoogleAdManager = window.GoogleAdManager || {};

  /**
   * Configuração padrão do AdManager
   * @type {AdManagerConfig}
   */
  const defaultConfig = {
    networkCode: '1234567',
    adUnitPath: '/rede/site',
    collapseEmptyDivs: true,
    enableSingleRequest: true,
    disableInitialLoad: false
  };

  /**
   * Mapeamento de posições para tamanhos de anúncios
   * @type {Object<string, AdSizeMapping[]>}
   */
  const adSizesByPosition = {
    'topo': [
      { viewport: [0, 0], sizes: [{ width: 320, height: 50 }, { width: 320, height: 100 }] },
      { viewport: [750, 0], sizes: [{ width: 728, height: 90 }] },
      { viewport: [1050, 0], sizes: [{ width: 970, height: 90 }, { width: 970, height: 250 }] }
    ],
    'lateral': [
      { viewport: [0, 0], sizes: [] }, // Sem anúncios em mobile
      { viewport: [1000, 0], sizes: [{ width: 300, height: 250 }, { width: 300, height: 600 }] }
    ],
    'rodape': [
      { viewport: [0, 0], sizes: [{ width: 320, height: 50 }] },
      { viewport: [750, 0], sizes: [{ width: 728, height: 90 }] }
    ],
    'inread': [
      { viewport: [0, 0], sizes: [{ width: 300, height: 250 }] },
      { viewport: [750, 0], sizes: [{ width: 640, height: 360 }] }
    ],
    // Posição padrão caso não seja especificada
    'default': [
      { viewport: [0, 0], sizes: [{ width: 300, height: 250 }] },
      { viewport: [750, 0], sizes: [{ width: 300, height: 250 }] }
    ]
  };

  /**
   * Classe principal do AdManager
   */
  class AdManager {
    /**
     * Cria uma instância do AdManager
     * @param {Partial<AdManagerConfig>} config - Configuração do AdManager
     */
    constructor(config = {}) {
      this.config = { ...defaultConfig, ...config };
      this.slots = new Map();
      this.initialized = false;
      this.googletag = null;
      this.resizeTimeout = null;
    }

    /**
     * Inicializa o Google Ad Manager
     * @returns {Promise<void>}
     */
    init() {
      return new Promise((resolve) => {
        if (this.initialized) {
          resolve();
          return;
        }

        // Adiciona o script do GPT de forma assíncrona
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        
        script.onload = () => {
          // Garante que o objeto googletag esteja disponível
          window.googletag = window.googletag || { cmd: [] };
          this.googletag = window.googletag;
          
          // Configura o GPT
          this.googletag.cmd.push(() => {
            // Habilita o SRA (Single Request Architecture) se configurado
            if (this.config.enableSingleRequest) {
              this.googletag.pubads().enableSingleRequest();
            }
            
            // Colapsa divs vazias se configurado
            if (this.config.collapseEmptyDivs) {
              this.googletag.pubads().collapseEmptyDivs();
            }
            
            // Desabilita o carregamento inicial se configurado
            if (this.config.disableInitialLoad) {
              this.googletag.pubads().disableInitialLoad();
            }
            
            // Ativa os serviços
            this.googletag.enableServices();
            
            this.initialized = true;
            resolve();
          });
        };
        
        document.head.appendChild(script);
      });
    }

    /**
     * Detecta e configura todos os slots de anúncios na página
     */
    detectAdSlots() {
      if (!this.initialized) {
        console.warn('AdManager não inicializado. Execute init() primeiro.');
        return;
      }

      // Limpa slots existentes
      this.slots.clear();

      // Encontra todas as divs com classe 'pubad'
      const adDivs = document.querySelectorAll('.pubad');
      
      adDivs.forEach((div, index) => {
        const element = div;
        const id = element.id || `ad-slot-${index}`;
        
        // Se não tiver ID, atribui um
        if (!element.id) {
          element.id = id;
        }
        
        // Obtém a posição do atributo data-pos ou usa 'default'
        const position = element.dataset.pos || 'default';
        
        // Obtém o mapeamento de tamanhos para esta posição
        const sizeMapping = adSizesByPosition[position] || adSizesByPosition.default;
        
        // Obtém os tamanhos para a viewport atual
        const currentSizes = this.getCurrentSizes(sizeMapping);
        
        // Configura o slot
        const slotConfig = {
          id,
          sizes: currentSizes,
          sizeMapping
        };
        
        this.slots.set(id, slotConfig);
        
        // Define o slot no GPT
        this.defineSlot(slotConfig);
      });
    }

    /**
     * Define um slot no GPT
     * @param {AdSlotConfig} config - Configuração do slot
     * @private
     */
    defineSlot(config) {
      this.googletag.cmd.push(() => {
        // Cria o caminho completo da unidade de anúncio
        const adUnitPath = `${this.config.networkCode}${this.config.adUnitPath}`;
        
        // Define o slot com os tamanhos disponíveis
        const slot = this.googletag.defineSlot(
          adUnitPath,
          config.sizes.map(size => [size.width, size.height]),
          config.id
        );
        
        if (!slot) {
          console.warn(`Não foi possível definir o slot: ${config.id}`);
          return;
        }
        
        // Adiciona o mapeamento de tamanhos responsivos
        if (config.sizeMapping && config.sizeMapping.length > 0) {
          const sizeMapping = this.googletag.sizeMapping();
          
          config.sizeMapping.forEach(mapping => {
            sizeMapping.addSize(
              mapping.viewport,
              mapping.sizes.length > 0 
                ? mapping.sizes.map(size => [size.width, size.height]) 
                : []
            );
          });
          
          slot.defineSizeMapping(sizeMapping.build());
        }
        
        // Adiciona targeting se disponível
        if (config.targeting) {
          Object.entries(config.targeting).forEach(([key, value]) => {
            slot.setTargeting(key, value);
          });
        }
        
        // Adiciona o slot
        slot.addService(this.googletag.pubads());
        
        // Renderiza o slot
        this.googletag.display(config.id);
      });
    }

    /**
     * Obtém os tamanhos para a viewport atual
     * @param {AdSizeMapping[]} sizeMapping - Mapeamento de tamanhos
     * @returns {AdSize[]} Tamanhos para a viewport atual
     * @private
     */
    getCurrentSizes(sizeMapping) {
      // Ordena o mapeamento do maior para o menor
      const sortedMapping = [...sizeMapping].sort((a, b) => {
        return b.viewport[0] - a.viewport[0];
      });
      
      const viewportWidth = window.innerWidth;
      
      // Encontra o primeiro mapeamento que se encaixa na viewport atual
      for (const mapping of sortedMapping) {
        if (viewportWidth >= mapping.viewport[0]) {
          return mapping.sizes;
        }
      }
      
      // Retorna tamanhos padrão se nenhum mapeamento for encontrado
      return [{ width: 300, height: 250 }];
    }

    /**
     * Atualiza os anúncios quando a viewport muda
     */
    refreshAds() {
      if (!this.initialized) return;
      
      this.googletag.cmd.push(() => {
        this.slots.forEach((config, id) => {
          const element = document.getElementById(id);
          if (!element) return;
          
          // Atualiza os tamanhos com base na viewport atual
          if (config.sizeMapping) {
            const currentSizes = this.getCurrentSizes(config.sizeMapping);
            config.sizes = currentSizes;
          }
        });
        
        // Atualiza todos os anúncios
        this.googletag.pubads().refresh();
      });
    }

    /**
     * Configura o evento de redimensionamento para atualizar anúncios
     */
    setupResizeListener() {
      window.addEventListener('resize', () => {
        if (this.resizeTimeout) {
          window.clearTimeout(this.resizeTimeout);
        }
        
        // Debounce para evitar muitas atualizações durante o redimensionamento
        this.resizeTimeout = window.setTimeout(() => {
          this.refreshAds();
        }, 300);
      });
    }

    /**
     * Configura o mapeamento de tamanhos para uma posição específica
     * @param {string} position - Nome da posição
     * @param {AdSizeMapping[]} mapping - Mapeamento de tamanhos
     */
    setPositionSizeMapping(position, mapping) {
      if (Array.isArray(mapping) && mapping.length > 0) {
        adSizesByPosition[position] = mapping;
      }
    }

    /**
     * Adiciona uma nova posição com mapeamento de tamanhos
     * @param {string} position - Nome da posição
     * @param {AdSizeMapping[]} mapping - Mapeamento de tamanhos
     */
    addPosition(position, mapping) {
      this.setPositionSizeMapping(position, mapping);
    }
  }

  // Cria uma instância global do AdManager
  const adManager = new AdManager();
  
  // Expõe a API pública
  window.GoogleAdManager = {
    /**
     * Inicializa o AdManager com configuração personalizada
     * @param {Partial<AdManagerConfig>} config - Configuração do AdManager
     * @returns {Promise<void>}
     */
    init: function(config = {}) {
      // Atualiza a configuração
      Object.assign(adManager.config, config);
      
      // Inicializa o AdManager
      return adManager.init().then(() => {
        // Detecta os slots de anúncios
        adManager.detectAdSlots();
        
        // Configura o listener de redimensionamento
        adManager.setupResizeListener();
        
        // Configura um MutationObserver para detectar novos slots de anúncios
        const observer = new MutationObserver((mutations) => {
          let shouldRefresh = false;
          
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node;
                  if (element.querySelector && (element.querySelector('.pubad') || element.classList && element.classList.contains('pubad'))) {
                    shouldRefresh = true;
                  }
                }
              });
            }
          });
          
          if (shouldRefresh) {
            // Atualiza os slots quando novos elementos são adicionados
            adManager.detectAdSlots();
          }
        });
        
        // Observa mudanças no DOM
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      });
    },
    
    /**
     * Atualiza manualmente os anúncios
     */
    refresh: function() {
      adManager.refreshAds();
    },
    
    /**
     * Configura o mapeamento de tamanhos para uma posição específica
     * @param {string} position - Nome da posição
     * @param {AdSizeMapping[]} mapping - Mapeamento de tamanhos
     */
    setPositionSizeMapping: function(position, mapping) {
      adManager.setPositionSizeMapping(position, mapping);
    },
    
    /**
     * Adiciona uma nova posição com mapeamento de tamanhos
     * @param {string} position - Nome da posição
     * @param {AdSizeMapping[]} mapping - Mapeamento de tamanhos
     */
    addPosition: function(position, mapping) {
      adManager.addPosition(position, mapping);
    }
  };

})(window, document);
