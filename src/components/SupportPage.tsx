import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  HelpCircle,
  MessageSquare,
  Send,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  ShieldCheck,
  Inbox,
  AlertCircle
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { language, t, currentUser, supportMessages, sendSupportMessage, fetchSupportMessages } = useApp();

  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'faq'>('form');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const faqs = [
    {
      qEn: 'How do I pay using MTN Mobile Money in Rwanda?',
      qRw: 'Nishyura nte nkoresheje MTN Mobile Money mu Rwanda?',
      aEn: 'Click "Upgrade to VIP" or any premium movie, select MTN Mobile Money, enter your Rwanda MTN phone number (078/079), and approve the USSD prompt on your phone by entering your Mobile Money PIN. Your VIP status will activate instantly!',
      aRw: 'Kanda kuri "Kugura VIP", hitamo MTN Mobile Money, andika numero yawe ya MTN (078/079), maze wemeze ubutumwa buzaza kuri telefone yawe winjiza umubare w\'ibanga wa MoMo. VIP yawe ihita itangira gukora ako kanya!'
    },
    {
      qEn: 'Can I download movies to watch offline without internet?',
      qRw: 'Nshobora gukuramo filme nkazireba nta murandasi (internet)?',
      aEn: 'Yes! Every NetStudio user can download any movie, episode, or a full season directly to their device storage (Downloads folder) and watch them anytime, even without an active internet connection.',
      aRw: 'Yego rwose! Ukoresha wese wa NetStudio arashobora gukuramo filme, episode, cyangwa season yose agashyira muri "Downloads" za telefone cyangwa mudasobwa ye akazireba igihe cyose niyo baba badafite internet.'
    },
    {
      qEn: 'What is "Agasobanuye" and who are the interpreters?',
      qRw: 'Agasobanuye ni iki kandi ni ba nde basobanura?',
      aEn: 'Agasobanuye is the beloved Rwandan tradition of live cinematic voice translation and commentary. NetStudio features the best interpreters in Rwanda including Rocky Kimomo, Junior Giti, Sankara, and Yanga.',
      aRw: 'Agasobanuye ni uburyo bwihariye bwo gusobanura no gushyira mu Kinyarwanda filme z\'amahanga. Muri NetStudio dufite abasobanuzi bakunzwe cyane mu Rwanda nka Rocky Kimomo, Junior Giti, Sankara na Yanga.'
    },
    {
      qEn: 'How do I watch Live TV channels (RBA, KC2, Sports)?',
      qRw: 'Nreba nte Televiziyo zikora ako kanya (Live TV)?',
      aEn: 'Click on the "Live TV" tab at the top or bottom navigation. You will find Rwanda TV channels like RBA, KC2, Flash TV, TV1, alongside international sports and news channels.',
      aRw: 'Kanda ku gice cya "Live TV" cyangwa "TV Zikora" hejuru cyangwa hasi. Urabonaho televiziyo zo mu Rwanda nka RBA, KC2, Flash TV, TV1, hamwe n\'izindi mpuzamahanga za siporo n\'amakuru.'
    }
  ];

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setStatusFeedback(null);

    const res = await sendSupportMessage(
      subject.trim() || (language === 'rw' ? 'Ikibazo cyangwa Ubufasha' : 'General Inquiry'),
      message.trim(),
      phone.trim()
    );

    setIsSubmitting(false);
    if (res.success) {
      setStatusFeedback({
        type: 'success',
        text:
          language === 'rw'
            ? 'Ubutumwa bwoherejwe neza ku buyobozi bwa NetStudio! Ubuyobozi burabusubiza mu kanya gato.'
            : 'Your message has been sent to NetStudio Support! An admin will review and reply shortly.'
      });
      setMessage('');
      setSubject('');
      fetchSupportMessages();
      setTimeout(() => setActiveTab('history'), 1200);
    } else {
      setStatusFeedback({
        type: 'error',
        text: res.message || 'Failed to dispatch message.'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-[#111111] p-6 sm:p-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {language === 'rw' ? 'Ubufasha & Kutwandikira' : 'Contact & Support'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              {language === 'rw'
                ? 'Ohereza ubutumwa ku buyobozi bwa NetStudio cyangwa ukurikirane ibisubizo byawe'
                : 'Direct line to NetStudio Admin & Support Team. Send inquiries, MoMo issues, or film requests.'}
            </p>
          </div>
        </div>

        {/* Quick Contact Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-zinc-800">
          <a
            href="https://wa.me/250796119924?text=Hello%20NetStudio%20Support%2C%20I%20need%20assistance"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-xs font-bold flex items-center space-x-2 hover:bg-[#25D366]/30 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t('whatsappSupport')} (+250 796 119 924)</span>
          </a>

          <a
            href="tel:+250796119924"
            className="px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center space-x-2 transition-colors"
          >
            <Phone className="w-4 h-4 text-green-400" />
            <span>{t('callHelpline')}: +250 796 119 924</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-800/80 pb-2">
        <button
          onClick={() => setActiveTab('form')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'form'
              ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{language === 'rw' ? 'Ohereza Ubutumwa' : 'Send Message to Admin'}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('history');
            fetchSupportMessages();
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>
            {language === 'rw' ? 'Ubutumwa Bwanjye' : 'My Inquiries'}
            {supportMessages.length > 0 && ` (${supportMessages.length})`}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'faq'
              ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('faqTitle')}</span>
        </button>
      </div>

      {/* Tab 1: Form */}
      {activeTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl bg-[#111111] border border-zinc-800 p-6 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-green-400" />
              <span>{language === 'rw' ? 'Andika ubutumwa bwawe hano' : 'Compose Message to Admin'}</span>
            </h3>

            {statusFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 ${
                  statusFeedback.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {statusFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{statusFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitMessage} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    {language === 'rw' ? 'Ingingo / Impamvu' : 'Subject'}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={language === 'rw' ? 'urugero: Kwishyura MoMo, Gusaba Filme...' : 'e.g., MTN MoMo Payment, Film request...'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    {language === 'rw' ? 'Numero ya Telefone' : 'Contact Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250 78/79..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  {language === 'rw' ? 'Ubutumwa burambuye' : 'Message Details'} *
                </label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    language === 'rw'
                      ? 'Sobanura neza ikibazo ufite cyangwa icyo wifuza ko ubuyobozi bwa NetStudio bugufashamo...'
                      : 'Describe your issue or question in detail. NetStudio support team monitors messages 24/7...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-green-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-zinc-500 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                  <span>
                    {language === 'rw'
                      ? 'Ubutumwa bwawe bubikwa mu buryo bwizewe (Encrypted)'
                      : 'Your messages are private and only visible to Admin.'}
                  </span>
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending...' : language === 'rw' ? 'Ohereza Ubutumwa' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Helper Box */}
          <div className="rounded-3xl bg-[#111111] border border-zinc-800 p-6 space-y-4">
            <h4 className="font-bold text-sm text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-400" />
              <span>{language === 'rw' ? 'Amasaha y\'Akazi' : 'Response Hours'}</span>
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {language === 'rw'
                ? 'Itsinda ryacu rya NetStudio Support rikora iminsi 7/7, amasaha 24/24. Ibisubizo byoherezwa mu butumwa bwawe bwite.'
                : 'NetStudio Support team operates 24/7. Admin replies will appear directly under "My Inquiries" and trigger a user notification.'}
            </p>
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Average Response:</span>
                <span className="text-green-400 font-bold">&lt; 15 Minutes</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">MoMo Activations:</span>
                <span className="text-green-400 font-bold">Instant / Automatic</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Inquiries History */}
      {activeTab === 'history' && (
        <div className="rounded-3xl bg-[#111111] border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <Inbox className="w-4 h-4 text-green-400" />
              <span>{language === 'rw' ? 'Amateka y\'Ubutumwa bwawe' : 'My Support Inquiries & Admin Replies'}</span>
            </h3>
            <button
              onClick={fetchSupportMessages}
              className="text-xs text-green-400 hover:text-green-300 font-semibold cursor-pointer"
            >
              {language === 'rw' ? 'Kuvugurura' : 'Refresh'}
            </button>
          </div>

          {supportMessages.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                {language === 'rw'
                  ? 'Nta butumwa urohereza ku buyobozi bwa NetStudio.'
                  : 'You have not sent any support inquiries yet.'}
              </p>
              <button
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 rounded-xl bg-green-500 text-black text-xs font-bold hover:bg-green-400 cursor-pointer"
              >
                {language === 'rw' ? 'Andika ubutumwa bwa mbere' : 'Send First Message'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {supportMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-white">{msg.subject}</h4>
                      <p className="text-[11px] text-zinc-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          msg.reply
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}
                      >
                        {msg.reply
                          ? language === 'rw'
                            ? 'Byasubijwe'
                            : 'Replied by Admin'
                          : language === 'rw'
                          ? 'Biracyasuzumwa'
                          : 'Pending Review'}
                      </span>
                    </div>
                  </div>

                  {/* User Question */}
                  <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/60 text-xs text-zinc-200">
                    <div className="text-[10px] font-bold text-zinc-400 mb-1 flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{language === 'rw' ? 'Ubutumwa bwawe:' : 'Your Inquiry:'}</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>

                  {/* Admin Reply */}
                  {msg.reply && (
                    <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/30 text-xs text-green-300 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-green-400 mb-1">
                        <div className="flex items-center space-x-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{msg.repliedBy || 'NetStudio Admin'}</span>
                        </div>
                        {msg.repliedAt && (
                          <span className="text-[10px] text-zinc-500 font-normal">
                            {new Date(msg.repliedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap text-zinc-200">{msg.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: FAQs */}
      {activeTab === 'faq' && (
        <div className="rounded-3xl bg-[#111111] border border-zinc-800 p-5 space-y-3">
          <h3 className="font-bold text-base text-white mb-2 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-green-400" />
            <span>{t('faqTitle')}</span>
          </h3>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              const question = language === 'rw' ? faq.qRw : faq.qEn;
              const answer = language === 'rw' ? faq.aRw : faq.aEn;

              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-3.5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-green-400 flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0 ml-2" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-3.5 pb-3.5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-2.5">
                      {answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

