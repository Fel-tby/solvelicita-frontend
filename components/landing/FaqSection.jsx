import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
  {
    q: 'O acesso ao score é gratuito?',
    a: 'Sim. O score é gratuito e está disponível para ser acessado e consultado por qualquer cidadão, empresa ou órgão público.'
  },
  {
    q: 'O score é uma nota oficial?',
    a: 'Não. O score é um modelo estatístico independente desenvolvido pelo SolveLicita a partir de dados oficiais do Tesouro Nacional, mas não representa a posição de nenhum órgão governamental.'
  },
  {
    q: 'Um município com risco baixo sempre paga em dia?',
    a: 'O Risco Baixo indica uma saúde fiscal e orçamentária equilibrada que historicamente afasta atrasos sistêmicos, mas não é uma garantia absoluta de que não ocorrerão atrasos pontuais.'
  },
  {
    q: 'Por que alguns municípios aparecem sem dados?',
    a: 'Se o município não enviou as declarações exigidas por lei (como RREO e RGF) aos sistemas do Governo Federal, não é possível calcular a sua capacidade estrutural de pagamento.'
  }
]

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="landing-section">
      <h3 className="landing-section-title">Perguntas frequentes</h3>
      
      <div className="faq-list">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={index} className="faq-item">
              <button 
                className="faq-question"
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp size={20} color="var(--text-light)" /> : <ChevronDown size={20} color="var(--text-light)" />}
              </button>
              
              {isOpen && (
                <div className="faq-answer">
                  {faq.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
