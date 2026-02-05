// Cloudflare Pages Function 프록시 경로
const PROXY_URL = '/api/gemini';

// DOM 요소
const dreamInput = document.getElementById('dream-input');
const interpretBtn = document.getElementById('interpret-btn');
const resultSection = document.getElementById('result-section');
const easternResult = document.getElementById('eastern-result');
const westernResult = document.getElementById('western-result');
const lottoBtn = document.getElementById('lotto-btn');
const lottoSection = document.getElementById('lotto-section');
const lottoLoading = document.getElementById('lotto-loading');
const lottoResult = document.getElementById('lotto-result');
const lottoNumbers = document.getElementById('lotto-numbers');
const loading = document.getElementById('loading');

// 해몽하기 버튼 클릭
interpretBtn.addEventListener('click', async () => {
  const dreamText = dreamInput.value.trim();

  if (!dreamText) {
    alert('꿈 내용을 입력해주세요.');
    return;
  }

  if (dreamText.length < 10) {
    alert('꿈 내용을 좀 더 자세히 적어주세요. (최소 10자)');
    return;
  }

  // UI 상태 변경
  interpretBtn.disabled = true;
  loading.classList.remove('hidden');
  resultSection.classList.add('hidden');

  try {
    // 동양 해몽과 서양 해몽을 병렬로 요청
    const [easternInterpretation, westernInterpretation] = await Promise.all([
      getInterpretation(dreamText, 'eastern'),
      getInterpretation(dreamText, 'western')
    ]);

    // 결과 표시
    easternResult.textContent = easternInterpretation;
    westernResult.textContent = westernInterpretation;

    resultSection.classList.remove('hidden');
    lottoBtn.classList.remove('hidden');
    lottoSection.classList.add('hidden');
    lottoResult.classList.add('hidden');

  } catch (error) {
    console.error('해몽 오류:', error);
    alert('해몽 중 오류가 발생했습니다. 다시 시도해주세요.');
  } finally {
    interpretBtn.disabled = false;
    loading.classList.add('hidden');
  }
});

// Gemini API로 해몽 요청
async function getInterpretation(dreamText, type) {
  const prompts = {
    eastern: `당신은 동양의 전통 해몽 전문가입니다. 다음 꿈에 대해 동양의 전통적인 관점(음양오행, 사주, 풍수지리, 동양 신화 등)에서 해몽해주세요.

꿈 내용: "${dreamText}"

다음 형식으로 800자 정도로 상세하게 해석해주세요:
1. 꿈의 상징적 의미 (동양적 관점)
2. 길흉 해석
3. 운세와 조언
4. 행운의 기운

친근하고 이해하기 쉽게 설명해주세요.`,

    western: `당신은 서양의 심리학적 해몽 전문가입니다. 다음 꿈에 대해 서양의 관점(프로이트, 융의 분석심리학, 현대 심리학 등)에서 해몽해주세요.

꿈 내용: "${dreamText}"

다음 형식으로 800자 정도로 상세하게 해석해주세요:
1. 꿈의 심리학적 상징
2. 무의식의 메시지
3. 현재 심리 상태 분석
4. 자기 성장을 위한 조언

친근하고 이해하기 쉽게 설명해주세요.`
  };

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompts[type]
        }]
      }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1024,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  const data = await response.json();

  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error('응답 파싱 실패');
}

// 로또 번호 받기 버튼 클릭
lottoBtn.addEventListener('click', () => {
  lottoBtn.disabled = true;
  lottoSection.classList.remove('hidden');
  lottoLoading.classList.remove('hidden');
  lottoResult.classList.add('hidden');

  // 3초 후 로또 번호 생성
  setTimeout(() => {
    const numbers = generateLottoNumbers();
    displayLottoNumbers(numbers);

    lottoLoading.classList.add('hidden');
    lottoResult.classList.remove('hidden');
    lottoBtn.disabled = false;
  }, 3000);
});

// 로또 번호 생성 (1-45 중 6개)
function generateLottoNumbers() {
  const numbers = [];
  while (numbers.length < 6) {
    const num = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers.sort((a, b) => a - b);
}

// 번호에 따른 공 색상 결정
function getBallColor(num) {
  if (num <= 10) return 'ball-yellow';
  if (num <= 20) return 'ball-blue';
  if (num <= 30) return 'ball-red';
  if (num <= 40) return 'ball-gray';
  return 'ball-green';
}

// 로또 번호 표시
function displayLottoNumbers(numbers) {
  lottoNumbers.innerHTML = '';

  numbers.forEach(num => {
    const ball = document.createElement('div');
    ball.className = `lotto-ball ${getBallColor(num)}`;
    ball.textContent = num;
    lottoNumbers.appendChild(ball);
  });
}
