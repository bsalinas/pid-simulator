module Jekyll

  class MachinePage < Page
    def initialize(site, base, machine, model)
      @site = site
      @base = base
      @machine = machine
      @model = model
      puts 
      @dir = machine['slug']
      @name = model['slug']+'.html'
      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), 'machine_layout.html')
      self.data['machine'] = machine
      self.data['model'] = model
      # # category_title_prefix = site.config['category_title_prefix'] || 'Category: '
      # self.data['title'] = recipe['title']
    end
  end

  class MachinePageGenerator < Generator
    safe true
    def generate(site)
      site.data['machines'].each do |machine|
        machine['models'].each do |model|
          site.pages << MachinePage.new(site, site.source, machine, model)
        end
      end
    end
  end
end